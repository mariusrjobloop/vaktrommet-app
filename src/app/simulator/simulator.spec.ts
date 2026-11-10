import { EventTransport } from '../incidents/event-transport';
import { IncidentEvent } from '../incidents/incident-event';
import { normalStream } from '../incidents/incident-event.fixtures';
import { buildSchedule } from './schedule';
import { createSimulator, Simulator } from './simulator';

const schedule = buildSchedule(normalStream, {
  seed: 7,
  startAt: '2026-07-04T21:47:00+02:00',
  outages: [{ startMs: 60_000, durationMs: 20_000 }],
});

/** Lenger enn hele tidsplanen (siste hendelse skjer etter 150 s). */
const WHOLE_RUN_MS = 200_000;

function collect(simulator: Simulator): IncidentEvent[] {
  const received: IncidentEvent[] = [];
  simulator.events$.subscribe((event) => received.push(event));
  return received;
}

function seqs(events: readonly IncidentEvent[]): number[] {
  return events.map((event) => event.seq);
}

describe('createSimulator', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('er et EventTransport', () => {
    const transport: EventTransport = createSimulator(schedule);

    expect(transport.events$).toBeDefined();
  });

  it('sender ingenting før start()', () => {
    const simulator = createSimulator(schedule);
    const received = collect(simulator);

    vi.advanceTimersByTime(30_000);

    expect(received).toEqual([]);
  });

  it('sender hendelsene når den simulerte tiden passerer tidspunktet deres', () => {
    const simulator = createSimulator(schedule);
    const received = collect(simulator);

    simulator.start();
    vi.advanceTimersByTime(12_000);

    expect(seqs(received)).toEqual([1, 2]);
  });

  it('stopper ved pause() og fortsetter der den slapp ved resume()', () => {
    const simulator = createSimulator(schedule);
    const received = collect(simulator);

    simulator.start();
    vi.advanceTimersByTime(6_000);
    expect(seqs(received)).toEqual([1]);

    simulator.pause();
    vi.advanceTimersByTime(60_000);
    expect(seqs(received)).toEqual([1]);

    simulator.resume();
    vi.advanceTimersByTime(6_000); // simulert tid er nå 12 s
    expect(seqs(received)).toEqual([1, 2]);
  });

  it('spiller av hele tidsplanen og stopper etter siste hendelse', () => {
    const simulator = createSimulator(schedule);
    const received = collect(simulator);

    simulator.start();
    vi.advanceTimersByTime(WHOLE_RUN_MS);

    expect(received).toEqual(schedule.deliveries.map((delivery) => delivery.event));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('spiller av likt to ganger etter reset()', () => {
    const simulator = createSimulator(schedule);
    const received = collect(simulator);

    simulator.start();
    vi.advanceTimersByTime(WHOLE_RUN_MS);
    const firstRun = [...received];

    received.length = 0;
    simulator.reset();
    simulator.start();
    vi.advanceTimersByTime(WHOLE_RUN_MS);

    expect(received).toEqual(firstRun);
  });

  describe('eventsSince', () => {
    it('gir hendelsene etter en seq, også dem som falt bort i nettbruddet', () => {
      const simulator = createSimulator(schedule);
      const received = collect(simulator);

      simulator.start();
      vi.advanceTimersByTime(95_000);

      expect(seqs(received)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 11]);
      expect(seqs(simulator.eventsSince(8))).toEqual([9, 10, 11]);
    });

    it('gir ikke hendelser som ikke er sendt ennå', () => {
      const simulator = createSimulator(schedule);

      simulator.start();
      vi.advanceTimersByTime(30_000);

      expect(seqs(simulator.eventsSince(0))).toEqual([1, 2, 3, 4]);
    });
  });
});
