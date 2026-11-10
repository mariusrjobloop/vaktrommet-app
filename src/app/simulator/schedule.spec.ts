import { normalStream } from '../incidents/incident-event.fixtures';
import { buildSchedule, Schedule } from './schedule';

/** Tid 0 i simulatoren. Den første hendelsen i fixtures skjedde 5 sekunder senere. */
const startAt = '2026-07-04T21:47:00+02:00';

function deliveredSeqs(schedule: Schedule): number[] {
  return schedule.deliveries.map((delivery) => delivery.event.seq);
}

describe('buildSchedule', () => {
  it('leverer hver hendelse én gang, i rekkefølge, når ingen forstyrrelser er slått på', () => {
    const schedule = buildSchedule(normalStream, { seed: 1, startAt });

    expect(schedule.deliveries.map((delivery) => delivery.event)).toEqual(normalStream);
  });

  it('leverer en hendelse på tidspunktet den skjedde, regnet fra startAt', () => {
    const schedule = buildSchedule(normalStream, { seed: 1, startAt });

    expect(schedule.deliveries[0].atMs).toBe(5_000); // 21:47:05
    expect(schedule.deliveries[1].atMs).toBe(12_000); // 21:47:12
  });

  it('gir samme tidsplan for samme seed', () => {
    const options = { seed: 7, startAt, duplicateRate: 0.3, reorderRate: 0.3 };

    expect(buildSchedule(normalStream, options)).toEqual(buildSchedule(normalStream, options));
  });

  it('gir en annen tidsplan for en annen seed', () => {
    const options = { startAt, duplicateRate: 0.3, reorderRate: 0.3 };

    expect(buildSchedule(normalStream, { ...options, seed: 7 })).not.toEqual(
      buildSchedule(normalStream, { ...options, seed: 8 }),
    );
  });

  describe('duplikater', () => {
    it('leverer hver hendelse to ganger når duplicateRate er 1', () => {
      const schedule = buildSchedule(normalStream, { seed: 1, startAt, duplicateRate: 1 });

      expect(schedule.deliveries).toHaveLength(normalStream.length * 2);
      for (const event of normalStream) {
        const copies = schedule.deliveries.filter((d) => d.event.eventId === event.eventId);
        expect(copies).toHaveLength(2);
        expect(copies[1].event).toEqual(copies[0].event); // samme eventId og seq
        expect(copies[1].atMs).toBeGreaterThan(copies[0].atMs);
      }
    });

    it('lager noen, men ikke bare, duplikater med en lav rate', () => {
      const schedule = buildSchedule(normalStream, { seed: 3, startAt, duplicateRate: 0.3 });
      const extra = schedule.deliveries.length - normalStream.length;

      expect(extra).toBeGreaterThan(0);
      expect(extra).toBeLessThan(normalStream.length);
    });
  });

  describe('feil rekkefølge', () => {
    it('lar annenhver hendelse komme etter naboen sin når reorderRate er 1', () => {
      const schedule = buildSchedule(normalStream, { seed: 1, startAt, reorderRate: 1 });

      expect(deliveredSeqs(schedule)).toEqual([2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 13]);
    });

    it('forsinker hendelsen, men leverer den aldri før den har skjedd', () => {
      const plain = buildSchedule(normalStream, { seed: 1, startAt });
      const reordered = buildSchedule(normalStream, { seed: 1, startAt, reorderRate: 1 });

      for (const delivery of reordered.deliveries) {
        const original = plain.deliveries.find((d) => d.event.seq === delivery.event.seq);
        expect(delivery.atMs).toBeGreaterThanOrEqual(original!.atMs);
      }
    });

    it('lager feil rekkefølge med en lav rate', () => {
      const seqs = deliveredSeqs(
        buildSchedule(normalStream, { seed: 3, startAt, reorderRate: 0.3 }),
      );

      expect(seqs).not.toEqual([...seqs].sort((a, b) => a - b));
    });
  });

  describe('nettbrudd', () => {
    // 60–80 s etter start dekker 21:48:10 (seq 9) og 21:48:14 (seq 10).
    const outages = [{ startMs: 60_000, durationMs: 20_000 }];

    it('leverer ingenting i bruddet', () => {
      const schedule = buildSchedule(normalStream, { seed: 1, startAt, outages });

      expect(deliveredSeqs(schedule)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13]);
      for (const { atMs } of schedule.deliveries) {
        expect(atMs < 60_000 || atMs >= 80_000).toBe(true);
      }
    });

    it('beholder hendelsene fra bruddet i loggen', () => {
      const schedule = buildSchedule(normalStream, { seed: 1, startAt, outages });

      expect(schedule.log.map((entry) => entry.event)).toEqual(normalStream);
      expect(schedule.log[8]).toEqual({ sentAtMs: 70_000, event: normalStream[8] });
    });
  });

  it('har en logg i seq-rekkefølge uten duplikater, uansett forstyrrelser', () => {
    const schedule = buildSchedule(normalStream, {
      seed: 5,
      startAt,
      duplicateRate: 0.5,
      reorderRate: 0.5,
      outages: [{ startMs: 20_000, durationMs: 30_000 }],
    });

    expect(schedule.log.map((entry) => entry.event)).toEqual(normalStream);
  });

  it('avviser rater utenfor 0–1', () => {
    expect(() => buildSchedule(normalStream, { seed: 1, startAt, duplicateRate: 1.5 })).toThrow();
    expect(() => buildSchedule(normalStream, { seed: 1, startAt, reorderRate: -0.1 })).toThrow();
  });
});
