// Conexión con la API de Twitch para Stats (usa el token de la app, no hace falta cuenta)

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let cachedChannelId = null;

export function hasTwitchCredentials() {
  return Boolean(
    process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET && process.env.TWITCH_CHANNEL
  );
}

async function getTwitchToken() {
  const now = Date.now();

  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const tokenUrl =
    `https://id.twitch.tv/oauth2/token` +
    `?client_id=${process.env.TWITCH_CLIENT_ID}` +
    `&client_secret=${process.env.TWITCH_CLIENT_SECRET}` +
    `&grant_type=client_credentials`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not get Twitch token.");
  }

  const data = await response.json();

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + (data.expires_in - 300) * 1000;

  return cachedToken;
}

// path = lo que va después de https://api.twitch.tv/helix/
export async function twitchFetch(path, { method = "GET", body } = {}) {
  const token = await getTwitchToken();

  const response = await fetch(`https://api.twitch.tv/helix/${path}`, {
    method,
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Twitch API error ${response.status} (${path.split("?")[0]}).`);
  }

  return response.status === 204 ? null : response.json();
}

export async function getChannelId() {
  if (cachedChannelId) {
    return cachedChannelId;
  }

  const data = await twitchFetch(`users?login=${encodeURIComponent(process.env.TWITCH_CHANNEL)}`);
  const user = data.data && data.data.length > 0 ? data.data[0] : null;

  if (!user) {
    throw new Error("Twitch channel not found.");
  }

  cachedChannelId = user.id;

  return cachedChannelId;
}

function getImageUrl(url, width, height) {
  return url ? url.replace("%{width}", width).replace("%{height}", height).replace("{width}", width).replace("{height}", height) : "";
}

// Todos los streams que Twitch todavía tiene guardados (como máximo 100)
export async function getArchiveVods(channelId) {
  const data = await twitchFetch(
    `videos?user_id=${encodeURIComponent(channelId)}&first=100&type=archive&sort=time`
  );

  return (data.data || []).map((vod) => ({
    id: vod.id,
    streamId: vod.stream_id,
    title: vod.title,
    url: vod.url,
    thumbnailUrl: getImageUrl(vod.thumbnail_url, 640, 360),
    duration: vod.duration,
    viewCount: vod.view_count,
    createdAt: vod.created_at
  }));
}

// Categoría que tiene puesta el canal ahora mismo
export async function getChannelCategory(channelId) {
  const data = await twitchFetch(`channels?broadcaster_id=${encodeURIComponent(channelId)}`);
  const channel = data.data && data.data.length > 0 ? data.data[0] : null;

  return channel && channel.game_id ? { id: channel.game_id, name: channel.game_name } : null;
}

// Portadas de las categorías (las imágenes que muestra Twitch en el directorio)
export async function getCategoryCovers(ids) {
  if (ids.length === 0) {
    return {};
  }

  const data = await twitchFetch(`games?${ids.map((id) => `id=${encodeURIComponent(id)}`).join("&")}`);
  const covers = {};

  for (const game of data.data || []) {
    covers[game.id] = getImageUrl(game.box_art_url, 144, 192);
  }

  return covers;
}
