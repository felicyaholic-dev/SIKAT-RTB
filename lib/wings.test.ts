import { describe, expect, it } from "vitest";
import { WINGS, genderLabel, wingFromRoom } from "@/lib/wings";

describe("wingFromRoom", () => {
  it("resolves every wing from a WING-NOMOR room number", () => {
    for (const wing of WINGS) {
      expect(wingFromRoom(`${wing.code}-101`)).toEqual(wing);
    }
  });

  it("is case-insensitive and tolerant of surrounding whitespace", () => {
    expect(wingFromRoom(" a1-101 ")).toEqual(wingFromRoom("A1-101"));
    expect(wingFromRoom("a1-101")).not.toBeNull();
  });

  it("returns null for an unrecognized wing prefix", () => {
    expect(wingFromRoom("Z9-101")).toBeNull();
    expect(wingFromRoom("A128")).toBeNull(); // legacy pre-wing format, no hyphen
    expect(wingFromRoom("")).toBeNull();
  });

  it("does not partial-match a wing code as a substring of a longer prefix", () => {
    // "A1X" must not be mistaken for wing "A1".
    expect(wingFromRoom("A1X-101")).toBeNull();
  });

  it("every wing's gender is exactly LAKI_LAKI or PEREMPUAN (never TIDAK_DISEBUTKAN)", () => {
    for (const wing of WINGS) {
      expect(["LAKI_LAKI", "PEREMPUAN"]).toContain(wing.gender);
    }
  });

  it("has no duplicate wing codes", () => {
    const codes = WINGS.map((w) => w.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("genderLabel", () => {
  it("labels PEREMPUAN as perempuan and LAKI_LAKI as laki-laki", () => {
    expect(genderLabel("PEREMPUAN")).toBe("perempuan");
    expect(genderLabel("LAKI_LAKI")).toBe("laki-laki");
  });
});
