"use client";

import { useEffect, useState } from "react";

const FANARTS = [
  {
    image: "/fanart/fanart-01.jpg",
    artist: "ArtistName"
  },
  {
    image: "/fanart/fanart-02.jpg",
    artist: ""
  },
  {
    image: "/fanart/fanart-03.jpg",
    artist: "ArtistName"
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

      <section className="card fanart-card">
        <div className="fanart-header">
          <p className="label fanart-label">Community</p>
          <h1>Fanart Gallery</h1>
          <p className="fanart-description">
            Latest fanarts made by the community.
          </p>
        </div>

        <div className="fanart-grid">
          {FANARTS.map((fanart, index) => (
            <button
              className="fanart-item"
              key={`${fanart.image}-${index}`}
              type="button"
              onClick={() => setSelectedFanart(fanart)}
            >
              <img src={fanart.image} alt={fanart.artist || "Fanart"} />

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
            aria-label="Close fanart preview"
          >
            ×
          </button>

          <div
            className="fanart-modal-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedFanart.image}
              alt={selectedFanart.artist || "Fanart"}
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
