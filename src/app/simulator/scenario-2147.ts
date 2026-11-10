import { Severity } from '../incidents/incident';
import { IncidentEvent, ReportedEvent } from '../incidents/incident-event';
import { normalStream } from '../incidents/incident-event.fixtures';
import { buildSchedule, Outage, Schedule } from './schedule';
import { createRandom, Random } from './seeded-random';

/*
 * Demoscenarioet: klokka er 21:47 og hovedartisten går på scenen. Et regnskyll gir 40
 * meldinger det første minuttet, mange om trengsel ved Port B. Den medisinske hendelsen ved
 * Scene 2 kommer fra fixtures. Så er nettet borte i 20 sekunder. Overtakelsen av
 * inc-port-b-1 etter bruddet kommer også fra fixtures. Alt er oppdiktet.
 */

export const SCENARIO_2147_START = '2026-07-04T21:47:00+02:00';
export const SCENARIO_2147_OUTAGE: Outage = { startMs: 60_000, durationMs: 20_000 };

const FIRST_MINUTE_MS = 60_000;
const MESSAGES_FIRST_MINUTE = 40;
/** Av de ekstra meldingene er resten værmeldinger. */
const EXTRA_PORT_B_REPORTS = 24;

const PORT_B_TITLES = [
  'Trengsel ved Port B',
  'Folk presser mot gjerdet ved Port B',
  'Køen står stille ved Port B',
  'Gjerdet gir etter ved Port B',
];

const WEATHER_REPORTS = [
  { title: 'Vann samler seg foran Scene 1', zoneId: 'scene-1' },
  { title: 'Glatt ved inngangen til Port A', zoneId: 'port-a' },
  { title: 'Telt blåser over på campingen', zoneId: 'camping' },
];

/** Bygger hele scenarioet. Samme seed gir samme tidsplan. */
export function scenario2147(seed: number): Schedule {
  const random = createRandom(seed);
  const startMs = Date.parse(SCENARIO_2147_START);
  const fixturesFirstMinute = normalStream.filter(
    (event) => Date.parse(event.occurredAt) - startMs < FIRST_MINUTE_MS,
  ).length;
  const extraCount = MESSAGES_FIRST_MINUTE - fixturesFirstMinute;

  const extra = Array.from({ length: extraCount }, (_, i) =>
    i < EXTRA_PORT_B_REPORTS ? portBReport(i, startMs, random) : weatherReport(i, startMs, random),
  );

  // Ny seq i den rekkefølgen kilden sender. eventId beholdes.
  const events: IncidentEvent[] = [...normalStream, ...extra]
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
    .map((event, i) => ({ ...event, seq: i + 1 }));

  return buildSchedule(events, {
    seed,
    startAt: SCENARIO_2147_START,
    duplicateRate: 0.1,
    reorderRate: 0.1,
    outages: [SCENARIO_2147_OUTAGE],
  });
}

function portBReport(i: number, startMs: number, random: Random): ReportedEvent {
  const severity: Severity = random() < 0.3 ? 2 : 3;
  return generatedReport(i, startMs, random, {
    title: pick(PORT_B_TITLES, random),
    category: 'crowd',
    severity,
    zoneId: 'port-b',
  });
}

function weatherReport(i: number, startMs: number, random: Random): ReportedEvent {
  const { title, zoneId } = pick(WEATHER_REPORTS, random);
  const severity: Severity = random() < 0.5 ? 3 : 4;
  return generatedReport(i, startMs, random, { title, category: 'weather', severity, zoneId });
}

function generatedReport(
  i: number,
  startMs: number,
  random: Random,
  payload: ReportedEvent['payload'],
): ReportedEvent {
  const id = String(i + 1).padStart(2, '0');
  return {
    eventId: `s-${id}`,
    seq: 0, // settes når alle hendelsene er sortert
    incidentId: `inc-s-${id}`,
    occurredAt: new Date(startMs + Math.floor(random() * FIRST_MINUTE_MS)).toISOString(),
    type: 'reported',
    payload,
  };
}

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}
