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
        <p className="label fanart-label">Community</p>
        <h1>Art Gallery</h1>
        <p>Latest artwork made by the community.</p>
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
