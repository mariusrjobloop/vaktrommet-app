import { SCENARIO_2147_OUTAGE, scenario2147 } from './scenario-2147';

const FIRST_MINUTE_MS = 60_000;

describe('scenario2147', () => {
  it('gir samme scenario for samme seed', () => {
    expect(scenario2147(1)).toEqual(scenario2147(1));
  });

  it('gir et annet scenario for en annen seed', () => {
    expect(scenario2147(1)).not.toEqual(scenario2147(2));
  });

  it('sender 40 meldinger det første minuttet', () => {
    const firstMinute = scenario2147(1).log.filter((entry) => entry.sentAtMs < FIRST_MINUTE_MS);

    expect(firstMinute).toHaveLength(40);
  });

  it('lar mange av meldingene det første minuttet gjelde trengsel ved Port B', () => {
    const portB = scenario2147(1).log.filter(
      ({ sentAtMs, event }) =>
        sentAtMs < FIRST_MINUTE_MS &&
        event.type === 'reported' &&
        event.payload.category === 'crowd' &&
        event.payload.zoneId === 'port-b',
    );

    expect(portB.length).toBeGreaterThanOrEqual(20);
  });

  it('har én medisinsk hendelse ved Scene 2 med alvorlighet 1', () => {
    const medical = scenario2147(1).log.filter(
      ({ event }) =>
        event.type === 'reported' &&
        event.payload.category === 'medical' &&
        event.payload.zoneId === 'scene-2',
    );

    expect(medical).toHaveLength(1);
    expect(medical[0].event.type === 'reported' && medical[0].event.payload.severity).toBe(1);
  });

  it('er uten nett i 20 sekunder etter det første minuttet', () => {
    const { startMs, durationMs } = SCENARIO_2147_OUTAGE;
    const endMs = startMs + durationMs;
    const { deliveries, log } = scenario2147(1);

    expect(durationMs).toBe(20_000);
    expect(startMs).toBeGreaterThanOrEqual(FIRST_MINUTE_MS);
    expect(deliveries.some(({ atMs }) => atMs >= startMs && atMs < endMs)).toBe(false);
    expect(log.some(({ sentAtMs }) => sentAtMs >= startMs && sentAtMs < endMs)).toBe(true);
  });

  it('har en logg med seq 1, 2, 3 … og unike eventId-er', () => {
    const { log } = scenario2147(1);

    expect(log.map(({ event }) => event.seq)).toEqual(log.map((_, i) => i + 1));
    expect(new Set(log.map(({ event }) => event.eventId)).size).toBe(log.length);
  });

  it('leverer både duplikater og hendelser i feil rekkefølge', () => {
    const delivered = scenario2147(1).deliveries.map(({ event }) => event);
    const seqs = delivered.map((event) => event.seq);

    expect(new Set(delivered.map((event) => event.eventId)).size).toBeLessThan(delivered.length);
    expect(seqs).not.toEqual([...seqs].sort((a, b) => a - b));
  });
});
