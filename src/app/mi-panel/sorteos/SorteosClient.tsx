"use client";

import { useEffect, useState } from "react";

export function SorteosClientTracker() {
  useEffect(() => {
    // Record the baseline timestamp for the current page view session.
    // This allows badges to evaluate whether a raffle is new relative to the user's PREVIOUS visit.
    const current = localStorage.getItem("lastSeenSorteoTime") || "0";
    sessionStorage.setItem("sessionLastSeenSorteoTime", current);

    // Update the main lastSeenSorteoTime in localStorage to now,
    // so subsequent page visits (or page reloads) will see it as read.
    localStorage.setItem("lastSeenSorteoTime", String(Date.now()));
  }, []);

  return null;
}

export function SorteoBadge({ createdAt }: { createdAt: string }) {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    // We read from sessionStorage which holds the baseline from the start of this page load,
    // or fall back to the live localStorage if sessionStorage is not set yet.
    const sessionSeen = sessionStorage.getItem("sessionLastSeenSorteoTime");
    const localSeen = localStorage.getItem("lastSeenSorteoTime");
    const lastSeen = sessionSeen || localSeen || "0";

    if (new Date(createdAt).getTime() > Number(lastSeen)) {
      setIsNew(true);
    }
  }, [createdAt]);

  if (!isNew) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md shadow-blue-200/50 animate-pulse shrink-0">
      Nuevo
    </span>
  );
}
