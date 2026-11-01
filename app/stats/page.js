"use client";

import { useEffect, useState } from "react";

// Textos de arriba de la página
const PAGE_TITLE = "Stream Stats";
const PAGE_INTRO = "Hours, streams and top categories of the month. Everything starts fresh every month.";

// Los días se cuentan en la hora de los streams (la misma del contador)
const STATS_TIMEZONE = "America/New_York";

// Etiquetas al costado de la cuadrícula: una fila por día, de lunes a domingo
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

// Colores de la cuadrícula según cuántas horas se streameó ese día
const CALENDAR_LEVELS = [
  { maxHours: 2, label: "Under 2h" },
  { maxHours: 4, label: "2h to 4h" },
  { maxHours: 6, label: "4h to 6h" },
  { maxHours: Infinity, label: "6h or more" }
];

const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" });
const dayName = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC"
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: STATS_TIMEZONE
});

// "2026-11" o "2026-11-05" → fecha (a medianoche UTC, solo para mostrar el nombre)
function keyToDate(key) {
  const [year, month, day = 1] = key.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatHours(seconds) {
  return seconds > 0 && seconds < 3600
    ? `${Math.round(seconds / 60)}m`
    : `${Math.round(seconds / 3600)}h`;
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

function getLevel(seconds) {
  return CALENDAR_LEVELS.findIndex((level) => seconds / 3600 < level.maxHours) + 1;
}

// Días del mes ordenados por semana (de lunes a domingo); null = casillero vacío
function getMonthCells(monthKey) {
  const date = keyToDate(monthKey);
  const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = Array((date.getUTCDay() + 6) % 7).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKey}-${String(day).padStart(2, "0")}`);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getDayNote(key, day) {
  if (!day) {
    return `${dayName.format(keyToDate(key))} · No stream`;
  }

  const extra = day.streams.length > 1 ? ` · ${day.streams.length} streams` : "";

  return `${dayName.format(keyToDate(key))} · ${formatDuration(day.seconds)}${extra} · ${cleanTitle(
    day.streams[0].title
  )}`;
}

export default function StatsPage() {
  const [month, setMonth] = useState("");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);
    setNote("");

    fetch(`/api/stream-stats${month ? `?month=${month}` : ""}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (ignore) {
          return;
        }

        if (data.error) {
          setError("Couldn't load stream stats right now.");
        } else {
          setStats(data);
          setError("");
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (!ignore) {
          setError("Couldn't load stream stats right now.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [month]);

  const isCurrentMonth = stats ? stats.month === stats.months[0] : true;
  const monthLabel = stats ? monthName.format(keyToDate(stats.month)) : "";
  const inMonth = isCurrentMonth ? "this month" : `in ${monthLabel}`;

  const numberCards = stats
    ? [
        { icon: "⏰", value: formatHours(stats.monthSeconds), label: `Hours ${inMonth}` },
        { icon: "🎮", value: stats.streamCount, label: `Streams ${inMonth}` },
        {
          icon: "⏳",
          value: formatDuration(stats.allTimeSeconds),
          label: "Total time streamed",
          note: stats.trackedSince ? `since ${shortDate.format(new Date(stats.trackedSince))}` : ""
        },
        {
          icon: "🏆",
          value: stats.longest ? formatDuration(stats.longest.seconds) : "—",
          label: "Longest stream",
          note: stats.longest ? shortDate.format(new Date(stats.longest.createdAt)) : ""
        }
      ]
    : [];

  const emptyNote = isCurrentMonth
    ? "No streams yet this month. See you at the next one ♡"
    : `No streams in ${monthLabel}.`;

  return (
    <main className="page stats-page">
      <section className="stats-hero">
        <p className="label">Brains</p>
        <h1>{PAGE_TITLE}</h1>
        <p>{PAGE_INTRO}</p>
      </section>

      {!stats && error ? (
        <p className="vods-message">{error}</p>
      ) : !stats ? (
        <p className="vods-message">Loading stream stats...</p>
      ) : (
        <div className={isLoading ? "stats-content stats-content-loading" : "stats-content"}>
          <div className="stats-months">
            {[...stats.months].reverse().map((key) => (
              <button
                className={key === stats.month ? "stats-month stats-month-active" : "stats-month"}
                type="button"
                key={key}
                onClick={() => setMonth(key)}
                aria-pressed={key === stats.month}
              >
                {monthName.format(keyToDate(key))}
              </button>
            ))}
          </div>

          <div className="stats-numbers">
            {numberCards.map((card) => (
              <div className="stats-number-card" key={card.label}>
                <span className="stats-number-icon" aria-hidden="true">
                  {card.icon}
                </span>
                <strong>{card.value}</strong>
                <p>{card.label}</p>
                {card.note ? <span className="stats-number-note">{card.note}</span> : null}
              </div>
            ))}
          </div>

          <div className="stats-row">
            <section className="stats-card stats-calendar-card">
              <div className="stats-card-head">
                <h2>Stream Calendar</h2>
                <span className="stats-card-tag">{monthLabel}</span>
              </div>

              <div className="stats-calendar-body">
                <div className="stats-grid">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <span className="stats-grid-label" key={`label-${index}`} aria-hidden="true">
                      {label}
                    </span>
                  ))}

                  {getMonthCells(stats.month).map((key, index) => {
                    if (!key) {
                      return <span className="stats-cell stats-cell-blank" key={`blank-${index}`}></span>;
                    }

                    const day = stats.days[key];
                    const classNames = ["stats-cell"];

                    if (key > stats.today) {
                      classNames.push("stats-cell-future");
                    }

                    if (key === stats.today) {
                      classNames.push("stats-cell-today");
                    }

                    if (!day) {
                      return (
                        <span
                          className={classNames.join(" ")}
                          key={key}
                          onMouseEnter={() => key <= stats.today && setNote(getDayNote(key, null))}
                        ></span>
                      );
                    }

                    classNames.push("stats-cell-stream", `stats-level-${getLevel(day.seconds)}`);

                    return (
                      <a
                        className={classNames.join(" ")}
                        key={key}
                        href={day.streams[0].url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={getDayNote(key, day)}
                        onMouseEnter={() => setNote(getDayNote(key, day))}
                        onFocus={() => setNote(getDayNote(key, day))}
                      ></a>
                    );
                  })}
                </div>
              </div>

              <p className="stats-calendar-note" aria-live="polite">
                {note || (stats.streamCount > 0 ? "Hover a square to see that day ♡" : emptyNote)}
              </p>

              <div className="stats-legend">
                <span>Less</span>
                <span className="stats-legend-swatch stats-legend-empty" title="No stream"></span>
                {CALENDAR_LEVELS.map((level, index) => (
                  <span
                    className={`stats-legend-swatch stats-level-${index + 1}`}
                    key={level.label}
                    title={level.label}
                  ></span>
                ))}
                <span>More</span>
              </div>
            </section>

            <section className="stats-card stats-categories-card">
              <div className="stats-card-head">
                <h2>Top Categories</h2>
                <span className="stats-card-tag">{monthLabel}</span>
              </div>

              {stats.categories.length > 0 ? (
                <ol className="stats-categories">
                  {stats.categories.map((category, index) => (
                    <li className="stats-category" key={category.id}>
                      <span className="stats-category-cover">
                        {category.coverUrl ? (
                          <img src={category.coverUrl} alt="" />
                        ) : (
                          <span aria-hidden="true">🎮</span>
                        )}
                        <span className="stats-category-rank">{index + 1}</span>
                      </span>

                      <div className="stats-category-info">
                        <div className="stats-category-top">
                          <strong>{category.name}</strong>
                          <span>{formatDuration(category.seconds)}</span>
                        </div>

                        <span className="stats-category-bar">
                          <span
                            style={{
                              width: `${(category.seconds / stats.categories[0].seconds) * 100}%`
                            }}
                          ></span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="stats-empty">
                  <span aria-hidden="true">🎮</span>
                  Categories show up here after each stream ♡
                </p>
              )}
            </section>
          </div>

          {stats.mostWatched.length > 0 ? (
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
                        {shortDate.format(new Date(vod.createdAt))} · {formatViews(vod.viewCount)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
