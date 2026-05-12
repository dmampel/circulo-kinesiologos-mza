"use client";

import { useEffect } from "react";
import { registrarLecturaAction } from "../actions";

export function ReadTracker({ circularId }: { circularId: string }) {
  useEffect(() => {
    registrarLecturaAction(circularId);
  }, [circularId]);

  return null;
}
