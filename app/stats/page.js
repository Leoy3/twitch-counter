"use client";

import { useEffect, useState } from "react";

// Textos de arriba de la página
const PAGE_TITLE = "Stream Stats";
const PAGE_INTRO = "Hours, streams and top categories of the month. Everything starts fresh every month.";

// Los días se cuentan en la hora de los streams (la misma del contador)
const STATS_TIMEZONE = "America/New_York";

// Etiquetas al costado de la cuadrícula: una fila por día, de lunes a domingo
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Colores de la cuadrícula según cuántas horas se streameó ese día
const CALENDAR_LEVELS = [
  { maxHours: 2, label: "Under 2h" },
  { maxHours: 4, label: "2h to 4h" },
  { maxHours: 6, label: "4h to 6h" },
  { maxHours: Infinity, label: "6h or more" }
];

// Cuántas portadas entran en el recuadro del día (el resto se muestra como "+2")
const DAY_COVERS_COUNT = 3;

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

// Igual que formatDuration, pero sin el "0h" cuando es menos de una hora
function formatTime(seconds) {
  return seconds < 3600 ? `${Math.round(seconds / 60)}m` : formatDuration(seconds);
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

function getDayLabel(key, day) {
  const date = dayName.format(keyToDate(key));

  return day ? `${date}, ${formatDuration(day.seconds)}: ${cleanTitle(day.streams[0].title)}` : date;
}

// El último día con stream del mes (es el que se muestra al entrar)
function getLatestDay(days) {
  return Object.keys(days).sort().at(-1) || "";
}

// Portadas de las categorías del día, abiertas como cartas en abanico.
// categories = null cuando ese día no hubo stream
function DayCovers({ categories }) {
  const shown = categories ? categories.slice(0, DAY_COVERS_COUNT) : [];
  const extra = categories ? categories.length - shown.length : 0;

  return (
    <div className="stats-day-covers" style={{ "--count": Math.max(shown.length, 1) }} aria-hidden="true">
      {shown.length > 0 ? (
        shown.map((category, index) => (
          <span className="stats-day-cover" key={category.id} style={{ "--i": index }}>
            {category.coverUrl ? <img src={category.coverUrl} alt="" /> : <span>🎮</span>}
          </span>
        ))
      ) : (
        <span className="stats-day-cover stats-day-cover-empty" style={{ "--i": 0 }}>
          <span>{categories ? "🎮" : "💤"}</span>
        </span>
      )}

      {extra > 0 ? <span className="stats-day-more">+{extra}</span> : null}
    </div>
  );
}

export default function StatsPage() {
  const [month, setMonth] = useState("");
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  // día que se muestra abajo de la cuadrícula: el último que tuvo el cursor encima
  const [activeDay, setActiveDay] = useState("");

  useEffect(() => {
    let ignore = false;

    setIsLoading(true);

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
          setActiveDay(getLatestDay(data.days));
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
        { icon: "⏰", value: formatDuration(stats.monthSeconds), label: "Total time streamed" },
        { icon: "🎮", value: stats.streamCount, label: `Streams ${inMonth}` },
        {
          icon: "🏆",
          value: stats.longest ? formatDuration(stats.longest.seconds) : "—",
          label: "Longest stream",
          note: stats.longest ? shortDate.format(new Date(stats.longest.createdAt)) : ""
        }
      ]
    : [];

  const shownDay = stats && activeDay ? stats.days[activeDay] : null;
  const shownGames = shownDay
    ? shownDay.categories.map((category) => `${category.name} ${formatTime(category.seconds)}`).join(" · ")
    : "";

  const emptyNote = isCurrentMonth
    ? "No streams yet this month. See you at the next one ♡"
    : `No streams in ${monthLabel}.`;

  return (
    <main className="page stats-page">
      <section className="stats-hero">
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
                  {WEEKDAY_LABELS.map((label) => (
                    <span className="stats-grid-label" key={label} aria-hidden="true">
                      {label}
                    </span>
                  ))}

                  {getMonthCells(stats.month).map((key, index) => {
                    if (!key) {
                      return <span className="stats-cell stats-cell-blank" key={`blank-${index}`}></span>;
                    }

                    const day = stats.days[key];
                    const isPast = key <= stats.today;
                    const classNames = ["stats-cell"];

                    if (!isPast) {
                      classNames.push("stats-cell-future");
                    }

                    if (key === stats.today) {
                      classNames.push("stats-cell-today");
                    }

                    if (day) {
                      classNames.push("stats-cell-stream", `stats-level-${getLevel(day.seconds)}`);
                    }

                    if (key === activeDay) {
                      classNames.push("stats-cell-active");
                    }

                    return (
                      <span
                        className={classNames.join(" ")}
                        key={key}
                        tabIndex={day ? 0 : undefined}
                        aria-label={day ? getDayLabel(key, day) : undefined}
                        onMouseEnter={isPast ? () => setActiveDay(key) : undefined}
                        onFocus={day ? () => setActiveDay(key) : undefined}
                      ></span>
                    );
                  })}
                </div>
              </div>

              {/* datos del día: alto fijo para que la card no cambie de tamaño */}
              <div className="stats-day-details" aria-live="polite">
                {!activeDay ? (
                  <p className="stats-day-empty">{emptyNote}</p>
                ) : (
                  <>
                    <DayCovers categories={shownDay ? shownDay.categories : null} />

                    <div className="stats-day-info">
                      <div className="stats-day-head">
                        <strong>{dayName.format(keyToDate(activeDay))}</strong>
                        {shownDay ? (
                          <span className="stats-day-time">{formatDuration(shownDay.seconds)}</span>
                        ) : null}
                        {shownDay && shownDay.streams.length > 1 ? (
                          <span className="stats-day-count">{shownDay.streams.length} streams</span>
                        ) : null}
                      </div>

                      {shownDay ? (
                        <>
                          <p className="stats-day-title" title={cleanTitle(shownDay.streams[0].title)}>
                            {cleanTitle(shownDay.streams[0].title)}
                          </p>
                          <p className="stats-day-games" title={shownGames}>
                            {shownGames || "No categories recorded for this stream"}
                          </p>
                        </>
                      ) : (
                        <p className="stats-day-games">No stream this day</p>
                      )}
                    </div>
                  </>
                )}
              </div>

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
                          <span>{formatTime(category.seconds)}</span>
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
        </div>
      )}
    </main>
  );
}
