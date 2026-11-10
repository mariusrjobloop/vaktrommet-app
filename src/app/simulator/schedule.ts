import { IncidentEvent } from '../incidents/incident-event';
import { createRandom, Random } from './seeded-random';

/** En melding slik den kommer fram hos klienten. */
export interface ScheduledDelivery {
  /** Millisekunder etter start i simulert tid. */
  readonly atMs: number;
  readonly event: IncidentEvent;
}

/** En melding slik kilden sendte den. Loggen er sannheten, uansett hva som kom fram. */
export interface LoggedEvent {
  readonly sentAtMs: number;
  readonly event: IncidentEvent;
}

/** Et tidsrom uten nett. Meldinger som skulle kommet fram da, leveres aldri. */
export interface Outage {
  readonly startMs: number;
  readonly durationMs: number;
}

export interface ScheduleOptions {
  readonly seed: number;
  /** ISO 8601-tidspunkt som er tid 0. En hendelse sendes på occurredAt minus startAt. */
  readonly startAt: string;
  /** Andel meldinger som leveres to ganger, fra 0 til 1. */
  readonly duplicateRate?: number;
  /** Andel meldinger som kommer fram etter naboen sin, fra 0 til 1. */
  readonly reorderRate?: number;
  readonly outages?: readonly Outage[];
}

export interface Schedule {
  /** Det klienten mottar, sortert på atMs. Kan ha duplikater, feil rekkefølge og hull. */
  readonly deliveries: readonly ScheduledDelivery[];
  /** Det kilden sendte, i seq-rekkefølge, én gang hver. */
  readonly log: readonly LoggedEvent[];
}

/** Største ekstra forsinkelse for en forsinket melding eller et duplikat. */
const MAX_EXTRA_DELAY_MS = 500;

/**
 * Lager en deterministisk tidsplan: samme hendelser og samme options gir alltid samme svar.
 * Hendelsene må være i seq-rekkefølge.
 */
export function buildSchedule(
  events: readonly IncidentEvent[],
  options: ScheduleOptions,
): Schedule {
  const { seed, startAt, duplicateRate = 0, reorderRate = 0, outages = [] } = options;
  assertRate('duplicateRate', duplicateRate);
  assertRate('reorderRate', reorderRate);

  const random = createRandom(seed);
  const startMs = Date.parse(startAt);
  const log: LoggedEvent[] = events.map((event) => ({
    sentAtMs: Date.parse(event.occurredAt) - startMs,
    event,
  }));

  const deliveries = withDuplicates(withReordering(log, reorderRate, random), duplicateRate, random)
    .filter(({ atMs }) => !outages.some((outage) => isDuring(outage, atMs)))
    .sort((a, b) => a.atMs - b.atMs); // stabil sortering beholder rekkefølgen ved likt atMs

  return { deliveries, log };
}

/**
 * Den første i et par blir forsinket til rett etter naboen. Paret byttes da om, men
 * ingen melding kommer fram før den ble sendt.
 */
function withReordering(
  log: readonly LoggedEvent[],
  rate: number,
  random: Random,
): ScheduledDelivery[] {
  const deliveries: ScheduledDelivery[] = [];
  for (let i = 0; i < log.length; i++) {
    const current = log[i];
    const next = log[i + 1];
    if (next && random() < rate) {
      deliveries.push({ atMs: next.sentAtMs, event: next.event });
      deliveries.push({ atMs: next.sentAtMs + extraDelay(random), event: current.event });
      i++; // naboen er allerede levert
    } else {
      deliveries.push({ atMs: current.sentAtMs, event: current.event });
    }
  }
  return deliveries;
}

/** Et duplikat er samme melding, med samme eventId og seq, levert litt senere. */
function withDuplicates(
  deliveries: readonly ScheduledDelivery[],
  rate: number,
  random: Random,
): ScheduledDelivery[] {
  return deliveries.flatMap((delivery) =>
    random() < rate
      ? [delivery, { atMs: delivery.atMs + extraDelay(random), event: delivery.event }]
      : [delivery],
  );
}

function extraDelay(random: Random): number {
  return 1 + Math.floor(random() * MAX_EXTRA_DELAY_MS);
}

function isDuring({ startMs, durationMs }: Outage, atMs: number): boolean {
  return atMs >= startMs && atMs < startMs + durationMs;
}

function assertRate(name: string, rate: number): void {
  if (!(rate >= 0 && rate <= 1)) {
    throw new RangeError(`${name} må være mellom 0 og 1, fikk ${rate}`);
  }
}
