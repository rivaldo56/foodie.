import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stableScore(seed: string, min: number, max: number) {
  if (min > max) {
    throw new Error("stableScore: min cannot be greater than max")
  }

  const range = max - min + 1
  const hash = Array.from(seed).reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) >>> 0
  }, 0)

  return min + (hash % range)
}
