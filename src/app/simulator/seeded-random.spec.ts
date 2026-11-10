import { createRandom } from './seeded-random';

function take(random: () => number, count: number): number[] {
  return Array.from({ length: count }, () => random());
}

describe('createRandom', () => {
  it('gir samme tallrekke for samme seed', () => {
    expect(take(createRandom(42), 5)).toEqual(take(createRandom(42), 5));
  });

  it('gir en annen tallrekke for en annen seed', () => {
    expect(take(createRandom(42), 5)).not.toEqual(take(createRandom(43), 5));
  });

  it('gir tall i [0, 1), også med seed 0', () => {
    for (const value of take(createRandom(0), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
