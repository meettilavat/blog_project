"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// The field chunk stays out of the loader's eager graph: it is only fetched
// after this loader mounts and the gate below passes (spec §5.1).
const HeroField = dynamic(() => import("@/components/field/hero-field"), { ssr: false });

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

function fieldDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  const connection = (navigator as NavigatorWithConnection).connection;
  if (connection?.saveData) return true;
  return false;
}

export default function HeroFieldLoader({ title }: { title: string }) {
  // Start disabled so nothing renders (and no field chunk is requested) until
  // the client-side gate has been evaluated.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!fieldDisabled()) setEnabled(true);
  }, []);

  if (!enabled) return null;
  return <HeroField title={title} />;
}
