"use client";

import { useEffect, useRef, useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"]
});

// Imagen principal: subí tu imagen a public/goals/ con este mismo nombre
// (o cambiá el nombre acá si tu archivo se llama distinto)
const MAIN_IMAGE = "/goals/Soon.jpg";

// Alto máximo de la imagen en % de la pantalla (50 = media pantalla, 100 = pantalla entera)
// La imagen siempre se muestra entera, sin recortes
const IMAGE_SCREEN_HEIGHT = 80;

// Mostrar las cards debajo de la imagen: true = se ven / false = ocultas
const SHOW_GOALS = false;

const POINTS_LABEL = "PTS";

// Cards: points = número, title = texto principal, subtitle = texto secundario
// completed: true = verde (completado) / false = rosa (no completado)
// Para agregar una card, copiá una línea y pegala donde quieras
const GOALS = [
  { points: 45, title: "Unmute", subtitle: "", completed: true },
  { points: 50, title: "Discord PFP", subtitle: "(One month)", completed: true },
  { points: 55, title: "Vote food", subtitle: "", completed: true },
  { points: 60, title: "UNLOCK SURPRISE", subtitle: "", completed: false },
  { points: 65, title: "1hr Spanish", subtitle: "(Subtitles will be provided)", completed: false },
  { points: 70, title: "Spooky stories", subtitle: "(Every night during Brainathon)", completed: false },
  { points: 75, title: "Doodles", subtitle: "", completed: false },
  { points: 80, title: "Mods take over", subtitle: "", completed: false },
  { points: 85, title: "Anime nights", subtitle: "(Chat choice 2 seasons MAX)", completed: false },
  { points: 90, title: "Karaoke night", subtitle: "", completed: false },
  { points: 95, title: "Pick redeem", subtitle: "", completed: false },
  { points: 100, title: "Giveaway", subtitle: "", completed: false },
  { points: 105, title: "Handcam", subtitle: "(For the rest of the month)", completed: false },
  { points: 110, title: "8 hours to timer", subtitle: "", completed: false },
  { points: 115, title: "Spicy water Challenge", subtitle: "", completed: false },
  { points: 120, title: "Spooky game", subtitle: "", completed: false },
  { points: 125, title: "Art comm", subtitle: "(Vote for next comm must be SFW", completed: false },
  { points: 130, title: "Elden Ring", subtitle: "", completed: false },
  { points: 135, title: "I make a cover", subtitle: "(Maybe chat decides song?)", completed: false },
  { points: 140, title: "VR stream", subtitle: "", completed: false },
  { points: 145, title: "Actually Try ASMR stream", subtitle: "", completed: false },
  { points: 150, title: "Merch", subtitle: "(Will be done by UWUMarket)", completed: false },
  { points: 155, title: "I play LOL...", subtitle: "", completed: false }
];

const GOALS_PER_ROW = 3;

function getGoalClassName(goal, isVisible) {
  const classNames = ["goal-card"];

  if (goal.completed) {
    classNames.push("goal-card-completed");
  }

  if (isVisible) {
    classNames.push("goal-card-visible");
  }

  return classNames.join(" ");
}

export default function GoalsPage() {
  const goalsListRef = useRef(null);
  const [visibleGoals, setVisibleGoals] = useState({});

  useEffect(() => {
    const element = goalsListRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const revealed = {};

        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealed[entry.target.dataset.index] = true;
            observer.unobserve(entry.target);
          }
        }

        if (Object.keys(revealed).length > 0) {
          setVisibleGoals((current) => ({ ...current, ...revealed }));
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    element.querySelectorAll(".goal-card").forEach((card) => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="page goals-page">
      <section className="card goals-image-card">
        <img
          src={MAIN_IMAGE}
          alt=""
          style={{ maxHeight: `${IMAGE_SCREEN_HEIGHT}vh` }}
        />
      </section>

      {SHOW_GOALS ? (
        <ul className={`goals-grid ${poppins.className}`} ref={goalsListRef}>
          {GOALS.map((goal, index) => (
            <li
              className={getGoalClassName(goal, visibleGoals[index])}
              key={`${goal.title}-${index}`}
              data-index={index}
              style={{ "--goal-delay": `${(index % GOALS_PER_ROW) * 90}ms` }}
            >
              <div className="goal-points">
                <strong>{goal.points}</strong>
                <span>{POINTS_LABEL}</span>
              </div>

              <div className="goal-text">
                <h3>{goal.title}</h3>
                {goal.subtitle ? <p>{goal.subtitle}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
