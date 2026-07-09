"use client";

import { useEffect, useState } from "react";

const US_TIMEZONE = "America/New_York";

const STREAM_HOUR_US = 15;
const STREAM_MINUTE_US = 0;

const WAIT_AFTER_STREAM_MS = 60 * 60 * 1000;
const VODS_PER_PAGE = 4;

const BRAINCELLS_TOP = {
  month: "July",
  highest: {
    title: "Highest braincells",
    username: "UsernameA",
    braincells: 9999
  },
  lowest: {
    title: "Lowest braincells",
    username: "UsernameB",
    braincells: 1
  }
};

const SOCIAL_LINKS = [
  {
    label: "Twitch",
    url: "https://www.twitch.tv/eatfreshbrains"
  },
  {
    label: "X",
    url: "https://x.com/soybrains"
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com/@imbrains"
  },
  {
    label: "VGen",
    url: "https://vgen.co/eatfreshbrains"
  },
  {
    label: "Throne",
    url: "https://throne.com/brains"
  }
];

function getTimeParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const result = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = Number(part.value);
    }
  }

  return result;
}

function getTimeZoneOffset(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  });

  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find((part) => part.type === "timeZoneName");

  if (!offsetPart) return 0;

  const match = offsetPart.value.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);

  if (!match) return 0;

  const hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;

  return (hours * 60 + Math.sign(hours) * minutes) * 60 * 1000;
}

function makeDateInTimeZone(year, month, day, hour, minute, second, timeZone) {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offset = getTimeZoneOffset(utcDate, timeZone);

  return new Date(utcDate.getTime() - offset);
}

function getDayOfWeekInTimeZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(date);
}

function getStreamState() {
  const now = new Date();
  const us = getTimeParts(now, US_TIMEZONE);

  let target = makeDateInTimeZone(
    us.year,
    us.month,
    us.day,
    STREAM_HOUR_US,
    STREAM_MINUTE_US,
    0,
    US_TIMEZONE
  );

  const targetDay = getDayOfWeekInTimeZone(target, US_TIMEZONE);
  const isStreamDay = targetDay !== "Sun";
  const waitEndsAt = new Date(target.getTime() + WAIT_AFTER_STREAM_MS);

  if (isStreamDay && now >= target && now < waitEndsAt) {
    return {
      phase: "waiting",
      target,
      waitEndsAt
    };
  }

  if (!isStreamDay || now >= waitEndsAt || now >= target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  while (getDayOfWeekInTimeZone(target, US_TIMEZONE) === "Sun") {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  return {
    phase: "countdown",
    target,
    waitEndsAt: null
  };
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hh}h ${mm}m ${ss}s`;
  }

  return `${hh}h ${mm}m ${ss}s`;
}

function formatViews(viewCount) {
  if (viewCount === 1) {
    return "1 view";
  }

  return `${viewCount || 0} views`;
}

function formatBraincells(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTimeAgo(dateString) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);
  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  if (weeks < 5) {
    return `${weeks}w ago`;
  }

  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${years}y ago`;
}

function chunkVods(vods) {
  const pages = [];

  for (let i = 0; i < vods.length; i += VODS_PER_PAGE) {
    pages.push(vods.slice(i, i + VODS_PER_PAGE));
  }

  return pages;
}

export default function Home() {
  const [status, setStatus] = useState(null);
  const [vodsData, setVodsData] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [waitingCountdown, setWaitingCountdown] = useState("");
  const [streamPhase, setStreamPhase] = useState("countdown");
  const [error, setError] = useState("");
  const [vodsError, setVodsError] = useState("");
  const [vodPageIndex, setVodPageIndex] = useState(0);

  async function loadStatus() {
    try {
      const response = await fetch("/api/twitch-status", {
        cache: "no-store"
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error checking Twitch status.");
        return;
      }

      setError("");
      setStatus(data);
    } catch {
      setError("Could not connect to the API.");
    }
  }

  async function loadVods() {
    try {
      const response = await fetch("/api/latest-vods", {
        cache: "no-store"
      });

      const data = await response.json();

      if (!response.ok) {
        setVodsError(data.error || "Error loading recent broadcasts.");
        return;
      }

      setVodsError("");
      setVodsData(data);
    } catch {
      setVodsError("Could not load recent broadcasts.");
    }
  }

  function slideVodsNext() {
    const vods = vodsData?.vods || [];
    const pages = chunkVods(vods);

    if (pages.length <= 1) {
      return;
    }

    setVodPageIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex > pages.length - 1) {
        return currentIndex;
      }

      return nextIndex;
    });
  }

  function slideVodsPrevious() {
    setVodPageIndex((currentIndex) => {
      const previousIndex = currentIndex - 1;

      if (previousIndex < 0) {
        return currentIndex;
      }

      return previousIndex;
    });
  }

  useEffect(() => {
    loadVods();

    const vodsInterval = setInterval(() => {
      loadVods();
    }, 60000);

    return () => clearInterval(vodsInterval);
  }, []);

  useEffect(() => {
    loadStatus();

    const statusInterval = setInterval(
      () => {
        loadStatus();
      },
      streamPhase === "waiting" ? 10000 : 60000
    );

    return () => clearInterval(statusInterval);
  }, [streamPhase]);

  useEffect(() => {
    function updateStreamTimer() {
      const streamState = getStreamState();

      setStreamPhase(streamState.phase);

      if (streamState.phase === "waiting") {
        setCountdown("00h 00m 00s");
        setWaitingCountdown(
          formatCountdown(streamState.waitEndsAt.getTime() - Date.now())
        );
        return;
      }

      setWaitingCountdown("");
      setCountdown(formatCountdown(streamState.target.getTime() - Date.now()));
    }

    updateStreamTimer();

    const timer = setInterval(() => {
      updateStreamTimer();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const vods = vodsData?.vods || [];
    const pages = chunkVods(vods);

    if (pages.length === 0) {
      setVodPageIndex(0);
      return;
    }

    if (vodPageIndex > pages.length - 1) {
      setVodPageIndex(0);
    }
  }, [vodsData, vodPageIndex]);

  const channelName = status?.displayName || status?.channel || "The channel";
  const channelUrl = status?.url || "#";
  const vods = vodsData?.vods || [];
  const vodPages = chunkVods(vods);
  const videosUrl = vodsData?.videosUrl || `${channelUrl}/videos`;

  const canGoPrevious = vodPageIndex > 0;
  const canGoNext = vodPageIndex < vodPages.length - 1;

  return (
    <main className="page">
      <div className="background"></div>
      <div className="overlay"></div>

      <section className="card">
        {error ? (
          <>
            <p className="label">Error</p>
            <h1>{error}</h1>
          </>
        ) : !status ? (
          <>
            <p className="label">Loading</p>
            <h1>Checking stream status...</h1>
          </>
        ) : status.isLive ? (
          <>
            <p className="label live-dot">Live now</p>

            <h1>
              <span className="channel-name">{channelName}</span> is live right now
            </h1>

            {status.title ? <p className="stream-title">{status.title}</p> : null}
            {status.gameName ? <p className="game-name">{status.gameName}</p> : null}

            <a className="button" href={channelUrl} target="_blank" rel="noreferrer">
              Watch on Twitch
            </a>
          </>
        ) : streamPhase === "waiting" ? (
          <>
            <p className="label">Waiting for stream</p>

            <h1>
              Waiting for <span className="channel-name">{channelName}</span>'s stream
            </h1>

            <div className="countdown">Waiting...</div>

            <p className="time-note">
              Checking if the stream is live. If it does not start in{" "}
              {waitingCountdown}, the timer will move to the next stream.
            </p>

            <a className="button secondary" href={channelUrl} target="_blank" rel="noreferrer">
              Open channel
            </a>
          </>
        ) : (
          <>
            <p className="label">Next stream</p>

            <h1>
              Time remaining until{" "}
              <span className="channel-name">{channelName}</span>'s stream
            </h1>

            <div className="countdown">{countdown}</div>

            <p className="time-note">
              The stream starts at 3:00 PM United States ET.
            </p>

            <a className="button secondary" href={channelUrl} target="_blank" rel="noreferrer">
              Open channel
            </a>
          </>
        )}

        <div className="reference-times">
          <span>Reference times</span>

          <div className="reference-times-row">
            <p>United States ET: 3:00 PM</p>
            <p>Mexico City: 1:00 PM</p>
          </div>
        </div>

        <div className="social-footer">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              className="social-button"
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>

      <section className="card braincells-card">
        <div className="braincells-header">
          <div>
            <p className="label braincells-label">{BRAINCELLS_TOP.month}</p>
            <h2>Monthly Braincells</h2>
          </div>
        </div>

        <div className="braincells-grid">
          <div className="braincell-stat-card braincell-stat-high">
            <p>{BRAINCELLS_TOP.highest.title}</p>
            <h3>{BRAINCELLS_TOP.highest.username}</h3>
            <strong>{formatBraincells(BRAINCELLS_TOP.highest.braincells)}</strong>
            <span>braincells</span>
          </div>

          <div className="braincell-stat-card braincell-stat-low">
            <p>{BRAINCELLS_TOP.lowest.title}</p>
            <h3>{BRAINCELLS_TOP.lowest.username}</h3>
            <strong>{formatBraincells(BRAINCELLS_TOP.lowest.braincells)}</strong>
            <span>braincells</span>
          </div>
        </div>
      </section>

      <section className="card vods-card">
        <div className="vods-header">
          <div>
            <h2>Latest streams</h2>
          </div>

          <a className="view-all-button" href={videosUrl} target="_blank" rel="noreferrer">
            View all
          </a>
        </div>

        {vodsError ? (
          <p className="vods-message">{vodsError}</p>
        ) : !vodsData ? (
          <p className="vods-message">Loading recent broadcasts...</p>
        ) : vods.length === 0 ? (
          <p className="vods-message">No recent broadcasts found.</p>
        ) : (
          <div className="vods-carousel">
            {canGoPrevious ? (
              <button
                className="vods-arrow-button vods-arrow-left"
                type="button"
                onClick={slideVodsPrevious}
                aria-label="Previous broadcasts"
              >
                <span className="vods-arrow-icon vods-arrow-icon-left"></span>
              </button>
            ) : null}

            <div className="vods-viewport">
              <div
                className="vods-pages-track"
                style={{
                  transform: `translateX(-${vodPageIndex * 100}%)`
                }}
              >
                {vodPages.map((page, pageIndex) => (
                  <div className="vods-page" key={`vod-page-${pageIndex}`}>
                    {page.map((vod) => (
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

                          <span className="vod-duration">{vod.duration}</span>
                        </div>

                        <div className="vod-info">
                          <h3>{vod.title}</h3>

                          <p>
                            {formatViews(vod.viewCount)} · {formatTimeAgo(vod.createdAt)}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {canGoNext ? (
              <button
                className="vods-arrow-button vods-arrow-right"
                type="button"
                onClick={slideVodsNext}
                aria-label="Next broadcasts"
              >
                <span className="vods-arrow-icon vods-arrow-icon-right"></span>
              </button>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
