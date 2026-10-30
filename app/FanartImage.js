"use client";

import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

export default function FanartImage({
  src,
  alt,
  sizes,
  quality = 85,
  loading = "lazy",
  onLoad
}) {
  const imageRef = useRef(null);
  const [useOriginal, setUseOriginal] = useState(false);

  const { props } = getImageProps({ src, alt, sizes, quality, fill: true });
  const { style, ...optimizedProps } = props;
  const imageProps = useOriginal ? { src, alt } : optimizedProps;

  function handleLoad() {
    if (onLoad) {
      onLoad();
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
      loading={loading}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}
