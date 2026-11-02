"use client";

import { Fragment, useEffect, useRef, useState } from "react";
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
  { points: 1, title: "Unmute", subtitle: "", completed: false },
  { points: 10, title: "Discord PFP", subtitle: "(One month)", completed: false },
  { points: 25, title: "Vote food", subtitle: "", completed: false },
  { points: 40, title: "UNLOCK SURPRISE", subtitle: "", completed: false },
  { points: 55, title: "1hr Spanish", subtitle: "(Subtitles will be provided)", completed: false },
  { points: 67, title: "Spooky stories", subtitle: "(Every night during Brainathon)", completed: false },
  { points: 80, title: "Doodles", subtitle: "Simple Doodles for chat", completed: false },
  { points: 100, title: "Mods take over", subtitle: "", completed: false },
  { points: 120, title: "Anime nights", subtitle: "(Chat choice 2 seasons MAX)", completed: false },
  { points: 150, title: "Karaoke night", subtitle: "", completed: false },
  { points: 167, title: "Pick redeem", subtitle: "", completed: false },
  { points: 180, title: "Giveaway", subtitle: "", completed: false },
  { points: 200, title: "Handcam", subtitle: "(For the rest of the month)", completed: false },
  { points: 250, title: "8 hours to timer", subtitle: "", completed: false },
  { points: 300, title: "Spicy water Challenge", subtitle: "", completed: false },
  { points: 350, title: "Spooky game", subtitle: "Chat picks - Will ty to finish", completed: false },
  { points: "???", title: "Art comm", subtitle: "(Vote for next comm must be SFW", completed: false },
  { points: "???", title: "Elden Ring", subtitle: "", completed: false },
  { points: "???", title: "I make a cover", subtitle: "(Maybe chat decides song?)", completed: false },
  { points: "???", title: "VR stream", subtitle: "", completed: false },
  { points: "???", title: "Actually TRY ASMR stream", subtitle: "", completed: false },
  { points: "???", title: "Merch", subtitle: "(Will be done by UWUMarket)", completed: false },
  { points: "???", title: "I play LOL...", subtitle: "For ONE stream and never again", completed: false }
];

const GOALS_PER_ROW = 3;

// Cards de info arriba de las goals (se muestran y ocultan junto con las goals)
// title = título de la card, lines = cada renglón
const INFO_CARDS = [
  {
    title: "Time",
    lines: ["1 Sub = 5 Minutes", "$1 Dono = 2 Minutes", "100 bits = 1 Minute"]
  },
  {
    title: "Points",
    lines: [
      "Tier 1 Sub = 3 Points",
      "Tier 2 Sub = 5 Points",
      "Tier 3 Sub = 10 Points",
      "$1/100 Bits = 1 Point"
    ]
  },
  {
    title: "Incentives",
    lines: [
      "Every 20 Points I spin the wheel",
      "5 Points : Sticky note on model",
      "30 Points : VIP/Custom Discord Role or can ask for spins",
      "Top 5 Supporters: Personalized signed digital Polaroid"
    ]
  }
];

// Texto que separa las goals con "???" del resto (va antes de la primera "???")
const EXTENDED_GOALS_LABEL = "EXTENDED GOALS";

// Footer debajo de las goals (se muestra y oculta junto con las goals), un renglón por texto
const FOOTER_LINES = [
  "Most funds will go into stocking up for cats (food / litter)",
  "The rest into stream and ton of hot cheeto bags"
];

const FIRST_EXTENDED_INDEX = GOALS.findIndex((goal) => goal.points === "???");

// Posición de la card dentro de su fila, contando desde el separador
function getRowPosition(index) {
  const start =
    FIRST_EXTENDED_INDEX !== -1 && index >= FIRST_EXTENDED_INDEX
      ? FIRST_EXTENDED_INDEX
      : 0;

  return (index - start) % GOALS_PER_ROW;
}

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
  const goalsContentRef = useRef(null);
  const [visibleGoals, setVisibleGoals] = useState({});

  useEffect(() => {
    const element = goalsContentRef.current;

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

    element
      .querySelectorAll(".goals-info-card, .goal-card, .goals-divider")
      .forEach((card) => {
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
        <div className="goals-content" ref={goalsContentRef}>
          <div className="goals-info">
            {INFO_CARDS.map((info, index) => (
              <section
                className={
                  visibleGoals[`info-${index}`]
                    ? "goals-info-card goals-info-card-visible"
                    : "goals-info-card"
                }
                key={info.title}
                data-index={`info-${index}`}
                style={{ "--goal-delay": `${index * 90}ms` }}
              >
                <h2>{info.title}</h2>
                <ul>
                  {info.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <ul className={`goals-grid ${poppins.className}`}>
            {GOALS.map((goal, index) => (
              <Fragment key={`${goal.title}-${index}`}>
                {index === FIRST_EXTENDED_INDEX ? (
                  <li
                    className={
                      visibleGoals.extended
                        ? "goals-divider goals-divider-visible"
                        : "goals-divider"
                    }
                    data-index="extended"
                  >
                    <span>{EXTENDED_GOALS_LABEL}</span>
                  </li>
                ) : null}

                <li
                  className={getGoalClassName(goal, visibleGoals[index])}
                  data-index={index}
                  style={{ "--goal-delay": `${getRowPosition(index) * 90}ms` }}
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
              </Fragment>
            ))}
          </ul>

          {/* aparece junto con la última goal: al final de la página el footer
              nunca llega a la zona donde se detecta la entrada en pantalla */}
          <footer
            className={
              visibleGoals[GOALS.length - 1]
                ? "goals-footer goals-footer-visible"
                : "goals-footer"
            }
          >
            {FOOTER_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </footer>
        </div>
      ) : null}
    </main>
  );
}
