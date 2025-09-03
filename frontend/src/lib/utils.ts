import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shrinkText = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  const ellipsis = "...";
  const charsToShow = maxLength - ellipsis.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);

  const start = text.slice(0, frontChars);
  const end = text.slice(-backChars);

  return `${start}${ellipsis}${end}`;
};
