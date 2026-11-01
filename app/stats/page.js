"use client";

import { useEffect, useMemo, useState } from "react";

// Textos de arriba de la página
const PAGE_TITLE = "Stream Stats";
const PAGE_INTRO = "Hours, streaks and favorite days from the streams saved on Twitch.";

// Cuántos streams se muestran en "Most Watched"
const MOST_WATCHED_COUNT = 3;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Colores del calendario según cuántas horas duró el stream de ese día
const CALENDAR_LEVELS = [
  { maxHours: 2, label: "Under 2h" },
  { maxHours: 4, label: "2h to 4h" },
  { maxHours: 6, label: "4h to 6h" },
  { maxHours: Infinity, label: "6h or more" }
];

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const monthName = new Intl.DateTimeFormat("en-US", { month: "short" });
const clockTime = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

// "5h57m30s" → segundos
function parseDuration(duration) {
  const hours = Number((duration.match(/(\d+)h/) || [])[1] || 0);
  const minutes = Number((duration.match(/(\d+)m/) || [])[1] || 0);
  const seconds = Number((duration.match(/(\d+)s/) || [])[1] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatViews(viewCount) {
  if (viewCount === 1) {
    return "1 view";
  }

  return `${new Intl.NumberFormat("en-US").format(viewCount || 0)} views`;
}

// Sin los comandos del chat del final (!braincells !lurk ...)
function cleanTitle(title) {
  return title.replace(/\s*![\w-]+/g, "").trim();
}

// Día en la hora local de quien mira la página
function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

// Lunes de la semana de esa fecha
function getWeekStart(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return addDays(start, -((start.getDay() + 6) % 7));
}

function getLevel(seconds) {
  const hours = seconds / 3600;

  return CALENDAR_LEVELS.findIndex((level) => hours < level.maxHours) + 1;
}

function buildStats(vods) {
  const streams = vods
    .map((vod) => ({
      ...vod,
      start: new Date(vod.createdAt),
      seconds: parseDuration(vod.duration || "")
    }))
    .filter((stream) => stream.seconds > 0)
    .sort((a, b) => a.start - b.start);

  if (streams.length === 0) {
    return null;
  }

  const totalSeconds = streams.reduce((total, stream) => total + stream.seconds, 0);
  const longest = streams.reduce((best, stream) => (stream.seconds > best.seconds ? stream : best));

  // streams agrupados por día
  const days = new Map();

  for (const stream of streams) {
    const key = getDayKey(stream.start);
    const day = days.get(key) || { seconds: 0, streams: [] };

    day.seconds += stream.seconds;
    day.streams.push(stream);
    days.set(key, day);
  }

  // semanas del calendario: desde la semana del primer stream hasta la actual
  const today = new Date();
  const todayKey = getDayKey(today);
  const calendar = [];

  for (
    let date = getWeekStart(streams[0].start);
    date <= addDays(getWeekStart(today), 6);
    date = addDays(date, 1)
  ) {
    calendar.push({
      key: getDayKey(date),
      date,
      isFuture: date > today && getDayKey(date) !== todayKey,
      isToday: getDayKey(date) === todayKey,
      stream: days.get(getDayKey(date)) || null
    });
  }

  // racha: días seguidos con stream, contando desde hoy (o desde ayer si hoy todavía no hubo)
  let streak = 0;
  let streakDate = days.has(todayKey) ? today : addDays(today, -1);

  while (days.has(getDayKey(streakDate))) {
    streak += 1;
    streakDate = addDays(streakDate, -1);
  }

  // en qué días de la semana hay más streams
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

  for (const stream of streams) {
    weekdayCounts[(stream.start.getDay() + 6) % 7] += 1;
  }

  // horario de inicio más común (la mediana), redondeado a 15 minutos
  const startMinutes = streams
    .map((stream) => stream.start.getHours() * 60 + stream.start.getMinutes())
    .sort((a, b) => a - b);
  const medianMinutes = startMinutes[Math.floor(startMinutes.length / 2)];
  const roundedMinutes = Math.round(medianMinutes / 15) * 15;
  const usualStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, roundedMinutes);

  const weeks = Math.max(1, (today - streams[0].start) / (7 * 86400000));

  return {
    count: streams.length,
    firstDate: streams[0].start,
    totalSeconds,
    averageSeconds: totalSeconds / streams.length,
    longest,
    calendar,
    streak,
    weekdayCounts,
    usualStart,
    streamsPerWeek: Math.round(streams.length / weeks),
    mostWatched: [...streams]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, MOST_WATCHED_COUNT)
  };
}

function getDayNote(day) {
  const first = day.stream.streams[0];
  const extra = day.stream.streams.length > 1 ? ` · ${day.stream.streams.length} streams` : "";

  return `${longDate.format(day.date)} · ${formatDuration(day.stream.seconds)}${extra} · ${cleanTitle(first.title)}`;
}

export default function StatsPage() {
  const [vods, setVods] = useState(null);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/vod-history", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) {
          return;
        }

        if (data.error) {
          setError("Couldn't load stream stats right now.");
        } else {
          setVods(data.vods || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Couldn't load stream stats right now.");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const stats = useMemo(() => (vods ? buildStats(vods) : null), [vods]);
  const topWeekdayCount = stats ? Math.max(...stats.weekdayCounts) : 0;

  const numberCards = stats
    ? [
        { icon: "⏰", value: `${Math.round(stats.totalSeconds / 3600)}h`, label: "Hours streamed" },
        { icon: "🎮", value: stats.count, label: "Streams" },
        { icon: "⏳", value: formatDuration(stats.averageSeconds), label: "Average stream" },
        {
          icon: "🏆",
          value: formatDuration(stats.longest.seconds),
          label: `Longest stream · ${shortDate.format(stats.longest.start)}`
        }
      ]
    : [];

  return (
    <main className="page stats-page">
      <section className="stats-hero">
        <p className="label">Brains</p>
        <h1>{PAGE_TITLE}</h1>
        <p>{PAGE_INTRO}</p>
      </section>

      {error ? (
        <p className="vods-message">{error}</p>
      ) : !vods ? (
        <p className="vods-message">Loading stream stats...</p>
      ) : !stats ? (
        <p className="vods-message">No streams saved on Twitch yet.</p>
      ) : (
        <div className="stats-content">
          <p className="stats-range">
            Since {shortDate.format(stats.firstDate)} · last {stats.count} streams
          </p>

          <div className="stats-numbers">
            {numberCards.map((card) => (
              <div className="stats-number-card" key={card.label}>
                <span className="stats-number-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <strong>{card.value}</strong>
                <p>{card.label}</p>
              </div>
            ))}
          </div>

          <div className="stats-row">
            <section className="stats-card stats-calendar-card">
              <div className="stats-card-head">
                <h2>Stream Calendar</h2>
                {stats.streak >= 2 ? (
                  <span className="stats-streak">🔥 {stats.streak}-day streak</span>
                ) : null}
              </div>

              <div className="stats-calendar-body">
                <div className="stats-calendar-weekdays" aria-hidden="true">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday.slice(0, 1)}</span>
                  ))}
                </div>

                <div className="stats-calendar">
                  {stats.calendar.map((day, index) => {
                    const showMonth = index === 0 || day.date.getDate() === 1;
                    const classNames = ["stats-day"];

                    if (day.isFuture) {
                      classNames.push("stats-day-future");
                    }

                    if (day.isToday) {
                      classNames.push("stats-day-today");
                    }

                    const content = (
                      <>
                        {showMonth ? (
                          <span className="stats-day-month">{monthName.format(day.date)}</span>
                        ) : null}
                        {day.date.getDate()}
                      </>
                    );

                    if (!day.stream) {
                      return (
                        <span className={classNames.join(" ")} key={day.key}>
                          {content}
                        </span>
                      );
                    }

                    classNames.push("stats-day-stream", `stats-day-level-${getLevel(day.stream.seconds)}`);

                    return (
                      <a
                        className={classNames.join(" ")}
                        key={day.key}
                        href={day.stream.streams[0].url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={getDayNote(day)}
                        onMouseEnter={() => setActiveDay(day)}
                        onFocus={() => setActiveDay(day)}
                      >
                        {content}
                      </a>
                    );
                  })}
                </div>
              </div>

              <p className="stats-calendar-note" aria-live="polite">
                {activeDay ? getDayNote(activeDay) : "Hover a pink day to see that stream ♡"}
              </p>

              <div className="stats-legend">
                <span>Shorter</span>
                {CALENDAR_LEVELS.map((level, index) => (
                  <span
                    className={`stats-legend-swatch stats-day-level-${index + 1}`}
                    key={level.label}
                    title={level.label}
                  ></span>
                ))}
                <span>Longer</span>
              </div>
            </section>

            <div className="stats-side">
              <section className="stats-card stats-time-card">
                <h2>Usually Live At</h2>
                <strong>{clockTime.format(stats.usualStart)}</strong>
                <p>your time · about {stats.streamsPerWeek} streams a week</p>
              </section>

              <section className="stats-card">
                <h2>Favorite Days</h2>

                <div className="stats-weekdays">
                  {WEEKDAYS.map((weekday, index) => {
                    const count = stats.weekdayCounts[index];
                    const isTop = count > 0 && count === topWeekdayCount;

                    return (
                      <div
                        className={isTop ? "stats-weekday stats-weekday-top" : "stats-weekday"}
                        key={weekday}
                      >
                        <strong>{count}</strong>
                        <span
                          className="stats-weekday-bar"
                          style={{
                            height: `${topWeekdayCount ? (count / topWeekdayCount) * 100 : 0}%`
                          }}
                        ></span>
                        <span>{weekday}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <section className="stats-most-watched">
            <div className="section-head">
              <span className="section-icon" aria-hidden="true">{"♥︎"}</span>
              <h2>Most Watched</h2>
            </div>

            <div className="stats-vods">
              {stats.mostWatched.map((vod, index) => (
                <a
                  key={vod.id}
                  className="vod-card"
                  href={vod.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="vod-thumbnail-wrap">
                    {vod.thumbnailUrl ? (
                      <img className="vod-thumbnail" src={vod.thumbnailUrl} alt={vod.title} />
                    ) : (
                      <div className="vod-thumbnail-placeholder"></div>
                    )}

                    <span className="stats-rank">#{index + 1}</span>
                    <span className="vod-duration">{vod.duration}</span>
                  </div>

                  <div className="vod-info">
                    <h3>{vod.title}</h3>

                    <p>
                      {shortDate.format(vod.start)} · {formatViews(vod.viewCount)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
