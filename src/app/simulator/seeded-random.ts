/** Gir et tall i [0, 1), som Math.random, men samme rekke hver gang for samme seed. */
export type Random = () => number;

/** Mulberry32: liten og rask, god nok til testdata. Ikke bruk den til kryptografi. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
