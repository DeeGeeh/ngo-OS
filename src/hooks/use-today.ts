"use client";

import { useSyncExternalStore } from "react";

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" });

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return dayFormat.format(new Date());
}

function getServerSnapshot() {
  return null;
}

export function useToday() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
