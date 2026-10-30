"use client";

import { useEffect, useRef, useState } from "react";
import FanartImage, { preloadFanartImage } from "../FanartImage";

const THUMBNAIL_SIZES = "(max-width: 560px) 100vw, (max-width: 760px) 50vw, 360px";
const PREVIEW_SIZES = "(max-width: 1028px) 100vw, 980px";
const PREVIEW_QUALITY = 90;
const PRELOAD_HOVER_DELAY_MS = 120;

const FANARTS = [
  {
    image: "/fanart/fanart-01.png",
    artist: "@Santa"
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

function preloadPreview(fanart) {
  preloadFanartImage({
    src: fanart.image,
    sizes: PREVIEW_SIZES,
    quality: PREVIEW_QUALITY
  });
}

function FanartPreview({ fanart }) {
  const [ratio, setRatio] = useState(fanart.ratio || 1);
  const [isLoaded, setIsLoaded] = useState(false);

  function handleLoad(image) {
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setRatio(image.naturalWidth / image.naturalHeight);
    }

    setIsLoaded(true);
  }

  return (
    <div
      className={isLoaded ? "fanart-preview fanart-preview-loaded" : "fanart-preview"}
      style={{ "--fanart-ratio": ratio }}
    >
      {fanart.thumbnail ? (
        <img src={fanart.thumbnail} alt="" aria-hidden="true" />
      ) : null}

      <FanartImage
        className="fanart-preview-full"
        src={fanart.image}
        alt={fanart.artist || "Artwork"}
        sizes={PREVIEW_SIZES}
        quality={PREVIEW_QUALITY}
        loading="eager"
        onLoad={handleLoad}
      />
    </div>
  );
}

export default function FanartPage() {
  const preloadTimerRef = useRef(null);
  const [selectedFanart, setSelectedFanart] = useState(null);
  const [loadedFanarts, setLoadedFanarts] = useState({});

  function openFanart(fanart, button) {
    const thumbnail = button.querySelector("img");
    const isThumbnailReady =
      thumbnail && thumbnail.complete && thumbnail.naturalWidth > 0;

    setSelectedFanart({
      ...fanart,
      thumbnail: isThumbnailReady ? thumbnail.currentSrc : null,
      ratio: isThumbnailReady
        ? thumbnail.naturalWidth / thumbnail.naturalHeight
        : null
    });
  }

  function closeModal() {
    setSelectedFanart(null);
  }

  function markFanartLoaded(index) {
    setLoadedFanarts((current) => ({ ...current, [index]: true }));
  }

  function schedulePreload(fanart) {
    clearTimeout(preloadTimerRef.current);
    preloadTimerRef.current = setTimeout(
      () => preloadPreview(fanart),
      PRELOAD_HOVER_DELAY_MS
    );
  }

  function cancelPreload() {
    clearTimeout(preloadTimerRef.current);
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
      clearTimeout(preloadTimerRef.current);
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
              className={
                loadedFanarts[index]
                  ? "fanart-item fanart-item-loaded"
                  : "fanart-item"
              }
              key={`${fanart.image}-${index}`}
              type="button"
              onPointerEnter={() => schedulePreload(fanart)}
              onPointerLeave={cancelPreload}
              onPointerDown={() => preloadPreview(fanart)}
              onFocus={() => preloadPreview(fanart)}
              onClick={(event) => openFanart(fanart, event.currentTarget)}
            >
              <FanartImage
                src={fanart.image}
                alt={fanart.artist || "Artwork"}
                sizes={THUMBNAIL_SIZES}
                onLoad={() => markFanartLoaded(index)}
              />

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
            <FanartPreview key={selectedFanart.image} fanart={selectedFanart} />

            <div className="fanart-modal-footer">
              {selectedFanart.artist ? (
                <p>by {selectedFanart.artist}</p>
              ) : null}

              <a
                className="view-all-button fanart-modal-original"
                href={selectedFanart.image}
                target="_blank"
                rel="noreferrer"
              >
                View original
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
