"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

const preloadedImages = new Set();

function getOptimizedProps({ src, alt, sizes, quality }) {
  const { props } = getImageProps({ src, alt, sizes, quality, fill: true });
  const { style, ...optimizedProps } = props;

  return optimizedProps;
}

export function preloadFanartImage({ src, sizes, quality = 85 }) {
  const props = getOptimizedProps({ src, alt: "", sizes, quality });

  if (preloadedImages.has(props.srcSet)) {
    return;
  }

  preloadedImages.add(props.srcSet);

  const image = new Image();
  image.sizes = props.sizes;
  image.srcset = props.srcSet;
  image.src = props.src;
}

export default function FanartImage({
  src,
  alt,
  sizes,
  quality = 85,
  loading = "lazy",
  className,
  onLoad
}) {
  const imageRef = useRef(null);
  const [useOriginal, setUseOriginal] = useState(false);

  const imageProps = useOriginal
    ? { src, alt }
    : getOptimizedProps({ src, alt, sizes, quality });

  function handleLoad() {
    if (onLoad) {
      onLoad(imageRef.current);
    }
  }

  function handleError() {
    setUseOriginal(true);
  }

  useEffect(() => {
    const image = imageRef.current;

    if (!image || !image.complete) {
      return;
    }

    if (image.naturalWidth > 0) {
      handleLoad();
    } else {
      handleError();
    }
  }, []);

  return (
    <img
      {...imageProps}
      ref={imageRef}
      className={className}
      loading={loading}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
