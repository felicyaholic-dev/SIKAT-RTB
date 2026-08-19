import type { Gender } from "@/lib/db";

export type Wing = {
  code: string;
  floor: string;
  gender: Extract<Gender, "LAKI_LAKI" | "PEREMPUAN">;
};

// Wing layout of the dorm building. Room numbers are expected in the format
// "WING-NOMOR" (e.g. "A1-101", "ALG-05") — the prefix before the first hyphen
// must match one of these codes. Each wing has a fixed gender, so a
// resident's gender must always agree with the wing their room is in.
export const WINGS: readonly Wing[] = [
  { code: "ALG", floor: "Lantai ALG", gender: "PEREMPUAN" },
  { code: "AG", floor: "Lantai AG", gender: "PEREMPUAN" },
  { code: "BG", floor: "Lantai BG", gender: "LAKI_LAKI" },
  { code: "A1", floor: "Lantai 1", gender: "PEREMPUAN" },
  { code: "B1", floor: "Lantai 1", gender: "PEREMPUAN" },
  { code: "A2", floor: "Lantai 2", gender: "PEREMPUAN" },
  { code: "B2", floor: "Lantai 2", gender: "PEREMPUAN" },
  { code: "A3", floor: "Lantai 3", gender: "LAKI_LAKI" },
  { code: "B3", floor: "Lantai 3", gender: "LAKI_LAKI" },
  { code: "A5", floor: "Lantai 5", gender: "LAKI_LAKI" },
];

export function wingFromRoom(room: string): Wing | null {
  const code = room.trim().toUpperCase().split(/[-\s]+/)[0];
  return WINGS.find((wing) => wing.code === code) ?? null;
}

export function genderLabel(gender: "LAKI_LAKI" | "PEREMPUAN") {
  return gender === "PEREMPUAN" ? "perempuan" : "laki-laki";
}
