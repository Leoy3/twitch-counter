"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FanartImage, { preloadFanartImage } from "./FanartImage";

const US_TIMEZONE = "America/New_York";

const STREAM_HOUR_US = 15;
const STREAM_MINUTE_US = 0;

const WAIT_AFTER_STREAM_MS = 60 * 60 * 1000;
const VODS_PER_PAGE = 3;

// Imagen del modelo en la home: subí tu PNG a public/home/ con este mismo nombre
// (o cambiá el nombre acá si tu archivo se llama distinto)
const HERO_MODEL_IMAGE = "/home/model.png";
const HERO_MODEL_SIZES = "(max-width: 760px) 90vw, 800px";

// Imagen sorpresa: cada click en el modelo tiene esta chance de mostrarla
// (0.067 = 6.7%). Una vez que sale, se queda hasta recargar la página
const HERO_SURPRISE_IMAGE = "/home/sixseven.png";
const HERO_SURPRISE_SIZES = "(max-width: 760px) 86vw, 560px";
const HERO_SURPRISE_CHANCE = 0.067;

const BRAINCELLS_TOP = {
  month: "November",
  highest: {
    title: "Highest braincells",
    username: "AstolfoOfCharlemagne",
    braincells: 9549
  },
  lowest: {
    title: "Lowest braincells",
    username: "Leoy",
    braincells: 1391
  }
};

// Fanarts del carrusel de la home (podés agregar o sacar)
const HOME_FANARTS = [
  {
    image: "/fanart/fanart-01.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-02.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-03.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-05.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-06.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-07.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-08.png",
    artist: ""
  }
];

// Texto introductorio debajo del título de cada sección de la home
const SECTION_INTROS = {
  streams: "Missed a stream? Catch up on the latest broadcasts.",
  braincells: "Who had the most (and the fewest) braincells this month.",
  fanart: "Artwork made with love for the community"
};

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

function easeInOutCubic(value) {
  if (value < 0.5) {
    return 4 * value * value * value;
  }

  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function normalizeTitle(title) {
  return String(title || "")
    .trim()
    .toLowerCase();
}

function isCurrentLiveVod(vod, streamStatus) {
  if (!streamStatus?.isLive) {
    return false;
  }

  const streamStartedAt = streamStatus.startedAt
    ? new Date(streamStatus.startedAt).getTime()
    : null;

  const vodCreatedAt = vod?.createdAt
    ? new Date(vod.createdAt).getTime()
    : null;

  const hasValidStreamDate = Number.isFinite(streamStartedAt);
  const hasValidVodDate = Number.isFinite(vodCreatedAt);

  if (hasValidStreamDate && hasValidVodDate) {
    const difference = Math.abs(vodCreatedAt - streamStartedAt);

    if (difference <= 30 * 60 * 1000) {
      return true;
    }
  }

  const streamTitle = normalizeTitle(streamStatus.title);
  const vodTitle = normalizeTitle(vod?.title);

  if (!streamTitle || !vodTitle || streamTitle !== vodTitle) {
    return false;
  }

  if (!hasValidVodDate) {
    return false;
  }

  const isVeryRecent = Date.now() - vodCreatedAt <= 24 * 60 * 60 * 1000;

  return isVeryRecent;
}

export default function Home() {
  const braincellsSectionRef = useRef(null);
  const braincellsAnimationDoneRef = useRef(false);
  const braincellsAnimationFrameRef = useRef(null);
  const heroModelButtonRef = useRef(null);

  const [status, setStatus] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [vodsData, setVodsData] = useState(null);
  const [vodsLoaded, setVodsLoaded] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [waitingCountdown, setWaitingCountdown] = useState("");
  const [streamPhase, setStreamPhase] = useState("countdown");
  const [error, setError] = useState("");
  const [vodsError, setVodsError] = useState("");
  const [vodPageIndex, setVodPageIndex] = useState(0);
  const [braincellsVisible, setBraincellsVisible] = useState(false);
  const [animatedBraincells, setAnimatedBraincells] = useState({
    highest: 0,
    lowest: 0
  });
  const [heroModelLoaded, setHeroModelLoaded] = useState(false);
  const [showHeroSurprise, setShowHeroSurprise] = useState(false);

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
    } finally {
      setStatusLoaded(true);
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
    } finally {
      setVodsLoaded(true);
    }
  }

  function getVisibleVods() {
    const rawVods = vodsData?.vods || [];

    return rawVods.filter((vod) => !isCurrentLiveVod(vod, status));
  }

  function slideVodsNext() {
    const vods = getVisibleVods();
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

  function scrollToTop() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }

  function preloadHeroSurprise() {
    preloadFanartImage({
      src: HERO_SURPRISE_IMAGE,
      sizes: HERO_SURPRISE_SIZES,
      quality: 90
    });
  }

  function handleHeroModelClick() {
    if (!showHeroSurprise && Math.random() < HERO_SURPRISE_CHANCE) {
      setShowHeroSurprise(true);
    }

    const button = heroModelButtonRef.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (button && button.animate && !prefersReducedMotion) {
      button.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.94)" },
          { transform: "scale(1.05)" },
          { transform: "scale(1)" }
        ],
        { duration: 450, easing: "ease-out" }
      );
    }
  }

  const startBraincellsAnimation = useCallback(() => {
    if (braincellsAnimationDoneRef.current) {
      return;
    }

    braincellsAnimationDoneRef.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setAnimatedBraincells({
        highest: BRAINCELLS_TOP.highest.braincells,
        lowest: BRAINCELLS_TOP.lowest.braincells
      });
      return;
    }

    const duration = 1800;
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      setAnimatedBraincells({
        highest: Math.round(BRAINCELLS_TOP.highest.braincells * easedProgress),
        lowest: Math.round(BRAINCELLS_TOP.lowest.braincells * easedProgress)
      });

      if (progress < 1) {
        braincellsAnimationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      setAnimatedBraincells({
        highest: BRAINCELLS_TOP.highest.braincells,
        lowest: BRAINCELLS_TOP.lowest.braincells
      });
    }

    braincellsAnimationFrameRef.current = requestAnimationFrame(animate);
  }, []);

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
    const visibleVods = getVisibleVods();
    const pages = chunkVods(visibleVods);

    if (pages.length === 0) {
      setVodPageIndex(0);
      return;
    }

    if (vodPageIndex > pages.length - 1) {
      setVodPageIndex(0);
    }
  }, [vodsData, status, vodPageIndex]);

  useEffect(() => {
    const element = braincellsSectionRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setBraincellsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.45
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();

      if (braincellsAnimationFrameRef.current) {
        cancelAnimationFrame(braincellsAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!braincellsVisible) {
      return;
    }

    if (!statusLoaded || !vodsLoaded) {
      return;
    }

    startBraincellsAnimation();
  }, [braincellsVisible, statusLoaded, vodsLoaded, startBraincellsAnimation]);

  const channelName = status?.displayName || status?.channel || "eatfreshbrains";
  const channelUrl = status?.url || "https://www.twitch.tv/eatfreshbrains";
  const vods = getVisibleVods();
  const vodPages = chunkVods(vods);
  const videosUrl = vodsData?.videosUrl || `${channelUrl}/videos`;

  const canGoPrevious = vodPageIndex > 0;
  const canGoNext = vodPageIndex < vodPages.length - 1;

  return (
    <main className="page home-page">
      <div className="background"></div>
      <div className="overlay"></div>

      <section className="hero-banner">
        <div className="hero-content">
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
                <span className="channel-name">{channelName}</span>
                <br />
                is live right now!
              </h1>

              {status.title ? <p className="stream-title">{status.title}</p> : null}
              {status.gameName ? <p className="game-name">{status.gameName}</p> : null}

              <div className="hero-actions">
                <a className="button hero-button" href={channelUrl} target="_blank" rel="noreferrer">
                  Watch on Twitch
                </a>

                {status.viewerCount ? (
                  <div className="viewer-badge">
                    <strong>{status.viewerCount}</strong>
                    <span>Viewers</span>
                  </div>
                ) : null}
              </div>
            </>
          ) : streamPhase === "waiting" ? (
            <>
              <p className="label">Waiting for stream</p>

              <h1>
                Waiting for <span className="channel-name">{channelName}</span>
              </h1>

              <p className="stream-title">
                Checking if the stream is live. If it does not start in{" "}
                {waitingCountdown}, the timer will move to the next stream.
              </p>

              <div className="hero-actions">
                <a className="button hero-button secondary" href={channelUrl} target="_blank" rel="noreferrer">
                  Open channel
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="label">Next stream</p>

              <h1>
                <span className="channel-name">{channelName}</span>
                <br />
                starts soon
              </h1>

              <div className="countdown">{countdown}</div>

              <p className="time-note">
                The stream starts at 3:00 PM United States ET.
              </p>

              <div className="hero-actions">
                <a className="button hero-button secondary" href={channelUrl} target="_blank" rel="noreferrer">
                  Open channel
                </a>
              </div>
            </>
          )}
        </div>

        <button
          ref={heroModelButtonRef}
          className={
            showHeroSurprise
              ? "hero-model-button hero-model-surprise"
              : "hero-model-button"
          }
          type="button"
          aria-label="Click me!"
          onClick={handleHeroModelClick}
          onPointerEnter={preloadHeroSurprise}
          onPointerDown={preloadHeroSurprise}
          onFocus={preloadHeroSurprise}
        >
          <FanartImage
            className={heroModelLoaded ? "hero-model hero-model-loaded" : "hero-model"}
            src={showHeroSurprise ? HERO_SURPRISE_IMAGE : HERO_MODEL_IMAGE}
            alt=""
            sizes={showHeroSurprise ? HERO_SURPRISE_SIZES : HERO_MODEL_SIZES}
            quality={90}
            loading="eager"
            onLoad={() => setHeroModelLoaded(true)}
          />
        </button>
      </section>

      <section className="home-sections">
        <section className="home-section streams-section">
          <div className="section-head">
            <span className="section-icon" aria-hidden="true">{"♥︎"}</span>
            <h2>Latest Streams</h2>
            <p>{SECTION_INTROS.streams}</p>
          </div>

          {vodsError ? (
            <p className="vods-message">{vodsError}</p>
          ) : !vodsData ? (
            <div className="vods-loading-area">
              <p className="vods-message">Loading recent broadcasts...</p>

              <div className="vods-skeleton-grid" aria-hidden="true">
                {[0, 1, 2].map((item) => (
                  <div className="vod-skeleton-card" key={item}>
                    <div className="vod-skeleton-thumb"></div>
                    <div className="vod-skeleton-line vod-skeleton-line-title"></div>
                    <div className="vod-skeleton-line vod-skeleton-line-meta"></div>
                  </div>
                ))}
              </div>
            </div>
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
                              {formatTimeAgo(vod.createdAt)} · {formatViews(vod.viewCount)}
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

          <div className="section-actions">
            <a className="button secondary" href={videosUrl} target="_blank" rel="noreferrer">
              View all streams
            </a>
          </div>
        </section>

        <section className="home-section braincells-section" ref={braincellsSectionRef}>
          <div className="section-head">
            <span className="section-icon" aria-hidden="true">🧠</span>
            <h2>Monthly Braincells</h2>
            <p>{SECTION_INTROS.braincells}</p>
            <span className="panel-month">{BRAINCELLS_TOP.month}</span>
          </div>

          <div className="braincells-stack">
            <div className="braincell-feature braincell-feature-high">
              <p>{BRAINCELLS_TOP.highest.title}</p>
              <strong>{formatBraincells(animatedBraincells.highest)}</strong>
              <span>{BRAINCELLS_TOP.highest.username}</span>
            </div>

            <div className="braincell-feature braincell-feature-low">
              <p>{BRAINCELLS_TOP.lowest.title}</p>
              <strong>{formatBraincells(animatedBraincells.lowest)}</strong>
              <span>{BRAINCELLS_TOP.lowest.username}</span>
            </div>
          </div>
        </section>

        <section className="home-section fanart-section">
          <div className="section-head">
            <span className="section-icon" aria-hidden="true">🎨</span>
            <h2>Art Gallery</h2>
            <p>{SECTION_INTROS.fanart}</p>
          </div>

          {HOME_FANARTS.length > 0 ? (
            <div
              className="home-fanart-carousel"
              style={{ "--fanart-count": HOME_FANARTS.length }}
            >
              {/* La lista va dos veces seguidas para que el loop no tenga cortes */}
              <div className="home-fanart-track">
                {[...HOME_FANARTS, ...HOME_FANARTS].map((fanart, index) => {
                  const position = index % HOME_FANARTS.length;
                  const isCopy = index >= HOME_FANARTS.length;

                  return (
                    <a
                      className={`home-fanart-item home-fanart-tilt-${position % 3}${
                        isCopy ? " home-fanart-copy" : ""
                      }`}
                      href="/fanart"
                      key={`${fanart.image}-${index}`}
                      aria-hidden={isCopy ? "true" : undefined}
                      tabIndex={isCopy ? -1 : undefined}
                    >
                      <FanartImage
                        src={fanart.image}
                        alt={fanart.artist ? `Art by ${fanart.artist}` : "Community artwork"}
                        sizes="(max-width: 760px) 62vw, 240px"
                        loading="eager"
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="vods-message">No artwork added yet.</p>
          )}

          <div className="section-actions">
            <a className="button" href="/fanart">
              Open gallery
            </a>
          </div>
        </section>
      </section>

      <section className="community-cta">
        <div className="community-cta-icon">♡</div>

        <div className="community-cta-text">
          <h2>Join the Community</h2>
          <p>Follow the stream, check recent broadcasts, and browse community artwork.</p>
        </div>

        <div className="community-cta-actions">
          <a className="button secondary" href={channelUrl} target="_blank" rel="noreferrer">
            Watch on Twitch
          </a>

          <button className="button" type="button" onClick={scrollToTop}>
            Back to top
          </button>
        </div>
      </section>

      <footer className="site-footer">
        <p>© 2026 EatFreshBrains</p>
      </footer>
    </main>
  );
}
