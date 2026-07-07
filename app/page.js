"use client";

import { useEffect, useState } from "react";

const US_TIMEZONE = "America/New_York";

const STREAM_HOUR_US = 15;
const STREAM_MINUTE_US = 0;

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

function getNextStreamDate() {
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

  if (target <= now) {
    const tomorrow = new Date(target);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    target = tomorrow;
  }

  return target;
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

export default function Home() {
  const [status, setStatus] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    loadStatus();

    const apiInterval = setInterval(() => {
      loadStatus();
    }, 60000);

    return () => clearInterval(apiInterval);
  }, []);

  useEffect(() => {
    function updateCountdown() {
      const nextStreamDate = getNextStreamDate();
      const difference = nextStreamDate.getTime() - Date.now();

      setCountdown(formatCountdown(difference));
    }

    updateCountdown();

    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const channelName = status?.displayName || status?.channel || "The channel";
  const channelUrl = status?.url || "#";

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
            <p>Argentina: 4:00 PM</p>
          </div>
        </div>
      </section>
    </main>
  );
}
