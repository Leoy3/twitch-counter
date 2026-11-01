"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "./theme";

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

// Botón fijo abajo a la izquierda: cambia entre modo claro y oscuro
// y guarda la elección en el navegador de cada visitante
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme === "dark");

    // si lo cambian en otra pestaña, esta también se actualiza
    function handleStorage(event) {
      if (event.key === THEME_STORAGE_KEY) {
        applyTheme(event.newValue === "dark");
        setIsDark(event.newValue === "dark");
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    } catch {
      // sin acceso al almacenamiento: cambia igual, pero no se recuerda
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // fundido suave entre los dos modos donde el navegador lo permite
    if (document.startViewTransition && !reduceMotion) {
      document.startViewTransition(() => applyTheme(nextIsDark));
    } else {
      applyTheme(nextIsDark);
    }

    setIsDark(nextIsDark);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <svg className="theme-toggle-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.2 14.6A8.6 8.6 0 0 1 9.4 3.8a.8.8 0 0 0-1-1A10 10 0 1 0 21.2 15.6a.8.8 0 0 0-1-1Z"
        />
      </svg>

      <svg className="theme-toggle-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.6" fill="currentColor" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>

      <span className="theme-toggle-label" aria-hidden="true">
        <span className="theme-toggle-moon">Dark mode</span>
        <span className="theme-toggle-sun">Light mode</span>
      </span>
    </button>
  );
}
