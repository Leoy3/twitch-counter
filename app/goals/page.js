"use client";

import { useEffect, useRef, useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"]
});

// Imagen principal: subí tu imagen a public/goals/ con este mismo nombre
// (o cambiá el nombre acá si tu archivo se llama distinto)
const MAIN_IMAGE = "/goals/main-image.jpg";

// Alto de la imagen en % de la pantalla (50 = media pantalla, 100 = pantalla entera)
const IMAGE_SCREEN_HEIGHT = 80;

// "cover" = llena toda la card (puede recortar bordes), "contain" = muestra la imagen entera
const IMAGE_FIT = "contain";

// Mostrar las cards debajo de la imagen: true = se ven / false = ocultas
const SHOW_GOALS = false;

const POINTS_LABEL = "PTS";

// Cards: points = número, title = texto principal, subtitle = texto secundario
// completed: true = verde (completado) / false = rosa (no completado)
// Para agregar una card, copiá una línea y pegala donde quieras
const GOALS = [
  { points: 45, title: "I Make a Cover", subtitle: "(one month)", completed: false },
  { points: 50, title: "Goal 2", subtitle: "(details)", completed: true },
  { points: 55, title: "Goal 3", subtitle: "(details)", completed: true },
  { points: 60, title: "Goal 4", subtitle: "(details)", completed: false },
  { points: 65, title: "Goal 5", subtitle: "(details)", completed: false },
  { points: 70, title: "Goal 6", subtitle: "(details)", completed: false },
  { points: 75, title: "Goal 7", subtitle: "(details)", completed: false },
  { points: 80, title: "Goal 8", subtitle: "(details)", completed: false },
  { points: 85, title: "Goal 9", subtitle: "(details)", completed: false },
  { points: 90, title: "Goal 10", subtitle: "(details)", completed: false },
  { points: 95, title: "Goal 11", subtitle: "(details)", completed: false },
  { points: 100, title: "Goal 12", subtitle: "(details)", completed: false },
  { points: 105, title: "Goal 13", subtitle: "(details)", completed: false },
  { points: 110, title: "Goal 14", subtitle: "(details)", completed: false },
  { points: 115, title: "Goal 15", subtitle: "(details)", completed: false },
  { points: 120, title: "Goal 16", subtitle: "(details)", completed: false },
  { points: 125, title: "Goal 17", subtitle: "(details)", completed: false },
  { points: 130, title: "Goal 18", subtitle: "(details)", completed: false },
  { points: 135, title: "Goal 19", subtitle: "(details)", completed: false },
  { points: 140, title: "Goal 20", subtitle: "(details)", completed: false },
  { points: 145, title: "Goal 21", subtitle: "(details)", completed: false },
  { points: 150, title: "Goal 22", subtitle: "(details)", completed: false },
  { points: 155, title: "Goal 23", subtitle: "(details)", completed: false },
  { points: 160, title: "Goal 24", subtitle: "(details)", completed: false }
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
      <section
        className="card goals-image-card"
        style={{ height: `${IMAGE_SCREEN_HEIGHT}vh` }}
      >
        <img src={MAIN_IMAGE} alt="" style={{ objectFit: IMAGE_FIT }} />
      </section>

      {SHOW_GOALS ? (
        <ul className={`goals-grid ${poppins.className}`} ref={goalsListRef}>
          {GOALS.map((goal, index) => (
            <li
              className={getGoalClassName(goal, visibleGoals[index])}
              key={`${goal.title}-${index}`}
              data-index={index}
              style={{ transitionDelay: `${(index % GOALS_PER_ROW) * 90}ms` }}
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
