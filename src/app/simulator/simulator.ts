import { interval, Subject, Subscription } from 'rxjs';
import { EventTransport } from '../incidents/event-transport';
import { IncidentEvent } from '../incidents/incident-event';
import { Schedule } from './schedule';

export interface SimulatorOptions {
  /** Hvor ofte den simulerte klokka går et steg fram, i millisekunder. */
  readonly tickMs?: number;
}

export interface Simulator extends EventTransport {
  /** Starter avspillingen fra der klokka står. */
  start(): void;
  /** Stopper klokka. Ingenting sendes før resume(). */
  pause(): void;
  /** Fortsetter der avspillingen ble pauset. */
  resume(): void;
  /** Stopper og spoler tilbake til tid 0, slik at start() spiller av alt på nytt. */
  reset(): void;
  /**
   * Hendelsene kilden har sendt etter en gitt seq, også dem som falt bort i et nettbrudd.
   * Brukes til ny synkronisering (modul 6).
   */
  eventsSince(seq: number): readonly IncidentEvent[];
}

/** Spiller av en tidsplan i simulert tid. Klokka går bare når simulatoren kjører. */
export function createSimulator(
  schedule: Schedule,
  { tickMs = 100 }: SimulatorOptions = {},
): Simulator {
  const events = new Subject<IncidentEvent>();
  const { deliveries, log } = schedule;
  const endMs = Math.max(
    0,
    ...deliveries.map(({ atMs }) => atMs),
    ...log.map(({ sentAtMs }) => sentAtMs),
  );

  let clockMs = 0;
  let cursor = 0;
  let ticking: Subscription | null = null;

  function tick(): void {
    clockMs += tickMs;
    while (cursor < deliveries.length && deliveries[cursor].atMs <= clockMs) {
      events.next(deliveries[cursor].event);
      cursor++;
    }
    if (clockMs >= endMs) {
      stop();
    }
  }

  function run(): void {
    if (!ticking && clockMs < endMs) {
      ticking = interval(tickMs).subscribe(tick);
    }
  }

  function stop(): void {
    ticking?.unsubscribe();
    ticking = null;
  }

  return {
    events$: events.asObservable(),
    start: run,
    resume: run,
    pause: stop,
    reset() {
      stop();
      clockMs = 0;
      cursor = 0;
    },
    eventsSince(seq) {
      return log
        .filter(({ sentAtMs, event }) => event.seq > seq && sentAtMs <= clockMs)
        .map(({ event }) => event);
    },
  };
}
