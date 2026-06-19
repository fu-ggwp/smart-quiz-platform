import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : null;
}
