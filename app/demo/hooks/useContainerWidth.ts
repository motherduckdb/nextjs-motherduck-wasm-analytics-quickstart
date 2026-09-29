"use client"

import { useEffect, useRef, useState } from "react";

export default function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
