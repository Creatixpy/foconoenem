"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type NewsImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
};

export default function NewsImage({ src, alt, ...props }: NewsImageProps) {
  const [fallback, setFallback] = useState(false);
  const resolvedSrc = !src || fallback ? "/foconoenemicon.png" : src;

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={() => setFallback(true)}
      unoptimized={!src || fallback}
    />
  );
}
