"use client";

import { useEffect, useState } from "react";

const FANARTS = [
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
    image: "/fanart/fanart-04.png",
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
  },
  {
    image: "/fanart/fanart-09.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-10.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-11.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-12.jpg",
    artist: ""
  },
  {
    image: "/fanart/fanart-13.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-14.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-15.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-16.jpg",
    artist: ""
  },
  {
    image: "/fanart/fanart-17.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-18.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-19.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-20.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-21.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-22.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-23.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-24.jpg",
    artist: ""
  },
  {
    image: "/fanart/fanart-25.png",
    artist: ""
  },

    {
    image: "/fanart/fanart-26.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-27.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-28.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-29.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-30.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-31.png",
    artist: ""
  },
  {
    image: "/fanart/fanart-32.png",
    artist: ""
  }
  
];

export default function FanartPage() {
  const [selectedFanart, setSelectedFanart] = useState(null);

  function closeModal() {
    setSelectedFanart(null);
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main className="page fanart-page">
      <div className="background"></div>
      <div className="overlay"></div>

      <section className="fanart-gallery-hero">
        <p className="label fanart-label">Brains</p>
        <h1>Art Gallery</h1>
      </section>

      <section className="card fanart-card">
        <div className="fanart-grid">
          {FANARTS.map((fanart, index) => (
            <button
              className="fanart-item"
              key={`${fanart.image}-${index}`}
              type="button"
              onClick={() => setSelectedFanart(fanart)}
            >
              <img src={fanart.image} alt={fanart.artist || "Artwork"} />

              {fanart.artist ? (
                <span>by {fanart.artist}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {selectedFanart ? (
        <div className="fanart-modal" onClick={closeModal}>
          <button
            className="fanart-modal-close"
            type="button"
            onClick={closeModal}
            aria-label="Close artwork preview"
          >
            ×
          </button>

          <div
            className="fanart-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedFanart.image}
              alt={selectedFanart.artist || "Artwork"}
            />

            {selectedFanart.artist ? (
              <p>by {selectedFanart.artist}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
