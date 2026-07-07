"use client";

import { useEffect, useState } from "react";

const MEXICO_TIMEZONE = "America/Mexico_City";
const STREAM_HOUR_MX = 13;
const STREAM_MINUTE_MX = 0;

function getMexicoParts(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIMEZONE,
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
  const mx = getMexicoParts(now);

  let target = makeDateInTimeZone(
    mx.year,
    mx.month,
    mx.day,
    STREAM_HOUR_MX,
    STREAM_MINUTE_MX,
    0,
    MEXICO_TIMEZONE
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
        setError(data.error || "Error consultando Twitch.");
        return;
      }

      setError("");
      setStatus(data);
    } catch {
      setError("No se pudo conectar con la API.");
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

  const channelName = status?.displayName || status?.channel || "El canal";
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
            <p className="label">Cargando</p>
            <h1>Consultando estado del stream...</h1>
          </>
        ) : status.isLive ? (
          <>
            <p className="label live-dot">En directo</p>
            <h1>{channelName} está en directo ahora mismo</h1>

            {status.title ? <p className="stream-title">{status.title}</p> : null}
            {status.gameName ? <p className="game-name">{status.gameName}</p> : null}

            <a className="button" href={channelUrl} target="_blank" rel="noreferrer">
              Ir al canal
            </a>
          </>
        ) : (
          <>
            <p className="label">Próximo stream</p>
            <h1>Horas restantes para el stream de {channelName}</h1>

            <div className="countdown">{countdown}</div>

            <p className="time-note">
              El stream comienza a las 13:00 MX / 16:00 Argentina
            </p>

            <a className="button secondary" href={channelUrl} target="_blank" rel="noreferrer">
              Ver canal
            </a>
          </>
        )}
      </section>
    </main>
  );
}
