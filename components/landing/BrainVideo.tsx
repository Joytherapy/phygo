"use client";

import { useEffect, useRef } from "react";

// Rendered from the CC BY 4.0 model in public/models/brain (the same model
// BrainMap3D loads), so the clip shows what the brain map actually displays.
// With reduced motion the poster frame is shown and the video never plays.
export default function BrainVideo({ label }: { label: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (query.matches) {
        video.pause();
        video.currentTime = 0;
      } else {
        video.play().catch(() => {});
      }
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="metadata"
      poster="/videos/brain-rotation-poster.jpg"
      aria-label={label}
      width={960}
      height={540}
      className="block aspect-video h-auto w-full bg-[#0B0D12] object-cover"
    >
      <source src="/videos/brain-rotation.mp4" type="video/mp4" />
      <source src="/videos/brain-rotation.webm" type="video/webm" />
    </video>
  );
}
