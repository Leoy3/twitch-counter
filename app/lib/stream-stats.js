// Stats del canal: se calculan por mes y se guardan en una base de datos chiquita
// (Upstash Redis, conectada desde Vercel) para no perder nada cuando Twitch borra los VODs viejos.
// Sin base de datos conectada, la página igual funciona con los VODs que Twitch tiene guardados.

import { getArchiveVods, getChannelCategory, getChannelId, twitchFetch } from "./twitch";

// Los meses y los días se cuentan en la hora de los streams (la misma del contador)
export const STATS_TIMEZONE = "America/New_York";

// Cuántas categorías se muestran en "Top Categories" y cuántos streams en "Most Watched"
const TOP_CATEGORIES_COUNT = 5;
const MOST_WATCHED_COUNT = 3;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: STATS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

// "2026-11-01"
export function getDayKey(date) {
  return dayFormat.format(date);
}

// "2026-11"
export function getMonthKey(date) {
  return getDayKey(date).slice(0, 7);
}

export function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

// "5h57m30s" → segundos
export function parseDuration(duration) {
  const hours = Number(((duration || "").match(/(\d+)h/) || [])[1] || 0);
  const minutes = Number(((duration || "").match(/(\d+)m/) || [])[1] || 0);
  const seconds = Number(((duration || "").match(/(\d+)s/) || [])[1] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

// Tiempo en cada categoría: cada tramo dura hasta el siguiente cambio (o hasta endTime)
export function getCategoryTimes(segments, endTime) {
  const times = new Map();

  segments.forEach((segment, index) => {
    const start = Date.parse(segment.at);
    const end = index + 1 < segments.length ? Date.parse(segments[index + 1].at) : endTime;
    const current = times.get(segment.id) || { id: segment.id, name: segment.name, seconds: 0 };

    current.seconds += Math.max(0, Math.round((end - start) / 1000));
    times.set(segment.id, current);
  });

  return [...times.values()];
}

/* ---------- base de datos (Upstash Redis por REST) ---------- */

const KEYS = {
  live: "stats:live",
  subscribed: "stats:subscribed",
  vods: (month) => `stats:vods:${month}`,
  categories: (month) => `stats:categories:${month}`,
  message: (id) => `stats:message:${id}`
};

function getStoreConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  return url && token ? { url, token } : null;
}

export function hasStore() {
  return Boolean(getStoreConfig());
}

// Manda varios comandos juntos y devuelve el resultado de cada uno
async function storeCommands(commands) {
  const { url, token } = getStoreConfig();

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(commands),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not reach the stats storage.");
  }

  const results = await response.json();

  return results.map((item) => {
    if (item.error) {
      throw new Error(item.error);
    }

    return item.result;
  });
}

// Guarda (o actualiza) los VODs, cada uno en su mes
export async function saveVods(vods) {
  const byMonth = new Map();

  for (const vod of vods) {
    const month = getMonthKey(new Date(vod.createdAt));
    const fields = byMonth.get(month) || [];

    fields.push(vod.id, JSON.stringify(vod));
    byMonth.set(month, fields);
  }

  if (byMonth.size === 0) {
    return;
  }

  await storeCommands([...byMonth].map(([month, fields]) => ["HSET", KEYS.vods(month), ...fields]));
}

// VODs y categorías guardados del mes pedido, y el stream en vivo (si hay)
async function readStoredStats(month) {
  const [vods, categories, live] = await storeCommands([
    ["HVALS", KEYS.vods(month)],
    ["HVALS", KEYS.categories(month)],
    ["GET", KEYS.live]
  ]);

  return {
    vods: vods.map((item) => JSON.parse(item)),
    categoryStreams: categories.map((item) => JSON.parse(item)),
    live: live ? JSON.parse(live) : null
  };
}

/* ---------- avisos de Twitch (EventSub): inicio, cambio de categoría y fin del stream ---------- */

const EVENT_TYPES = [
  { type: "stream.online", version: "1" },
  { type: "stream.offline", version: "1" },
  { type: "channel.update", version: "2" }
];

// Cierra el stream en vivo: guarda cuánto tiempo estuvo en cada categoría
async function finishLiveStream(live, endTime) {
  const month = getMonthKey(new Date(live.startedAt));
  const categories = getCategoryTimes(live.segments, endTime);

  await storeCommands([
    ["HSET", KEYS.categories(month), live.streamId, JSON.stringify({ startedAt: live.startedAt, categories })],
    ["DEL", KEYS.live]
  ]);
}

async function getLiveStream() {
  const [live] = await storeCommands([["GET", KEYS.live]]);

  return live ? JSON.parse(live) : null;
}

export async function handleStreamOnline(event) {
  const previous = await getLiveStream();

  if (previous && previous.streamId === event.id) {
    return;
  }

  // si se perdió el aviso de fin del stream anterior, se cierra con la duración de su VOD
  if (previous) {
    const vods = await getArchiveVods(event.broadcaster_user_id);
    const vod = vods.find((item) => item.streamId === previous.streamId);
    const lastChange = previous.segments.length > 0 ? previous.segments.at(-1).at : previous.startedAt;
    const endTime = vod
      ? Date.parse(previous.startedAt) + parseDuration(vod.duration) * 1000
      : Date.parse(lastChange);

    await finishLiveStream(previous, endTime);
  }

  const category = await getChannelCategory(event.broadcaster_user_id);

  const live = {
    streamId: event.id,
    startedAt: event.started_at,
    segments: category ? [{ ...category, at: event.started_at }] : []
  };

  await storeCommands([["SET", KEYS.live, JSON.stringify(live)]]);
}

export async function handleChannelUpdate(event) {
  const live = await getLiveStream();
  const last = live && live.segments.length > 0 ? live.segments.at(-1) : null;

  if (!live || !event.category_id || (last && last.id === event.category_id)) {
    return;
  }

  live.segments.push({
    id: event.category_id,
    name: event.category_name,
    at: new Date().toISOString()
  });

  await storeCommands([["SET", KEYS.live, JSON.stringify(live)]]);
}

export async function handleStreamOffline(event) {
  const live = await getLiveStream();

  if (live) {
    await finishLiveStream(live, Date.now());
  }

  // el VOD ya tiene la duración final: se guarda enseguida
  await saveVods(await getArchiveVods(event.broadcaster_user_id));
}

// Twitch puede mandar el mismo aviso más de una vez
export async function wasMessageHandled(id) {
  const [exists] = await storeCommands([["EXISTS", KEYS.message(id)]]);

  return exists === 1;
}

export async function markMessageHandled(id) {
  await storeCommands([["SET", KEYS.message(id), "1", "EX", "900"]]);
}

// Si Twitch da de baja un aviso, se vuelve a pedir en la próxima visita
export async function forgetSubscriptions() {
  await storeCommands([["DEL", KEYS.subscribed]]);
}

// Le pide a Twitch que avise de los streams. Solo en el sitio publicado, como mucho una vez por día
export async function ensureEventSubscriptions() {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!secret || !host || process.env.VERCEL_ENV !== "production" || !hasStore()) {
    return;
  }

  const [isFirstToday] = await storeCommands([["SET", KEYS.subscribed, "1", "NX", "EX", "86400"]]);

  if (isFirstToday !== "OK") {
    return;
  }

  try {
    const callback = `https://${host}/api/twitch-webhook`;
    const channelId = await getChannelId();
    const existing = await twitchFetch("eventsub/subscriptions");
    const mine = (existing.data || []).filter((item) => item.transport.callback === callback);
    const working = mine.filter((item) =>
      ["enabled", "webhook_callback_verification_pending"].includes(item.status)
    );

    // los que fallaron se borran para no ocupar lugar
    for (const item of mine.filter((subscription) => !working.includes(subscription))) {
      await twitchFetch(`eventsub/subscriptions?id=${item.id}`, { method: "DELETE" });
    }

    for (const event of EVENT_TYPES) {
      if (!working.some((item) => item.type === event.type)) {
        await twitchFetch("eventsub/subscriptions", {
          method: "POST",
          body: {
            type: event.type,
            version: event.version,
            condition: { broadcaster_user_id: channelId },
            transport: { method: "webhook", callback, secret }
          }
        });
      }
    }
  } catch (error) {
    // se vuelve a intentar en la próxima visita
    await forgetSubscriptions();
    throw error;
  }
}

/* ---------- cálculo de lo que muestra la página ---------- */

function getTopCategories(categoryStreams, live, month, now) {
  const totals = new Map();
  const lists = categoryStreams.map((stream) => stream.categories);

  // el stream en vivo también suma, hasta este momento
  if (live && getMonthKey(new Date(live.startedAt)) === month) {
    lists.push(getCategoryTimes(live.segments, now));
  }

  for (const category of lists.flat()) {
    const current = totals.get(category.id) || { ...category, seconds: 0 };

    current.seconds += category.seconds;
    totals.set(category.id, current);
  }

  return [...totals.values()]
    .filter((category) => category.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, TOP_CATEGORIES_COUNT);
}

// vods = todos los conocidos (de Twitch y de la base de datos)
export function buildMonthStats({ vods, categoryStreams = [], live = null, month, now = Date.now() }) {
  // sin repetidos: la base de datos y Twitch pueden tener el mismo VOD
  const unique = new Map();

  for (const vod of vods) {
    unique.set(vod.id, { ...vod, seconds: parseDuration(vod.duration) });
  }

  // solo los streams del mes pedido: todo se reinicia cada mes
  const streams = [...unique.values()]
    .filter((vod) => vod.seconds > 0 && getMonthKey(new Date(vod.createdAt)) === month)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const days = {};

  for (const stream of streams) {
    const key = getDayKey(new Date(stream.createdAt));
    const day = days[key] || { seconds: 0, streams: [] };

    day.seconds += stream.seconds;
    day.streams.push({ title: stream.title, url: stream.url, seconds: stream.seconds });
    days[key] = day;
  }

  const longest = streams.reduce((best, stream) => (!best || stream.seconds > best.seconds ? stream : best), null);
  const currentMonth = getMonthKey(new Date(now));

  return {
    month,
    months: [currentMonth, getPreviousMonthKey(currentMonth)],
    today: getDayKey(new Date(now)),
    monthSeconds: streams.reduce((total, stream) => total + stream.seconds, 0),
    streamCount: streams.length,
    longest: longest ? { seconds: longest.seconds, createdAt: longest.createdAt, url: longest.url } : null,
    days,
    categories: getTopCategories(categoryStreams, live, month, now),
    mostWatched: [...streams]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, MOST_WATCHED_COUNT)
      .map(({ id, title, url, thumbnailUrl, duration, viewCount, createdAt }) => ({
        id,
        title,
        url,
        thumbnailUrl,
        duration,
        viewCount,
        createdAt
      }))
  };
}

// Junta todo: VODs de Twitch + lo guardado, y guarda los VODs nuevos
export async function getStreamStats(month) {
  const channelId = await getChannelId();
  const twitchVods = await getArchiveVods(channelId);

  if (!hasStore()) {
    return { ...buildMonthStats({ vods: twitchVods, month }), isTracking: false };
  }

  try {
    await saveVods(twitchVods);

    const stored = await readStoredStats(month);

    return {
      ...buildMonthStats({ ...stored, vods: [...stored.vods, ...twitchVods], month }),
      isTracking: true
    };
  } catch {
    // si la base de datos falla, se muestra lo que tiene Twitch
    return { ...buildMonthStats({ vods: twitchVods, month }), isTracking: false };
  }
}
