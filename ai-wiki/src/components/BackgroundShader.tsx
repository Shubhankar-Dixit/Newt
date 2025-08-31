"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import UnicornScene from "unicornstudio-react";

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function onResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return windowSize;
}

export default function BackgroundShader({ className }: { className?: string }) {
  const { width, height } = useWindowSize();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || width === 0 || height === 0) {
    return <div className={cn("pointer-events-none", className)} />;
  }

  return (
    <div className={cn("pointer-events-none", className)}>
      <UnicornScene production projectId="1grEuiVDSVmyvEMAYhA6" width={width} height={height} />
    </div>
  );
}

