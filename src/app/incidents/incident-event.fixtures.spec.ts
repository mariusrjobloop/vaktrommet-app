import { Severity } from './incident';
import { INCIDENT_EVENT_TYPES, IncidentEvent } from './incident-event';
import {
  duplicateStream,
  gapStream,
  normalStream,
  outOfOrderStream,
} from './incident-event.fixtures';

const allStreams = { normalStream, duplicateStream, outOfOrderStream, gapStream };

function seqs(stream: readonly IncidentEvent[]): number[] {
  return stream.map((event) => event.seq);
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function missingSeqs(stream: readonly IncidentEvent[]): number[] {
  const present = new Set(seqs(stream));
  return range(Math.min(...present), Math.max(...present)).filter((seq) => !present.has(seq));
}

/** Kompilerer bare hvis payload snevres inn riktig og alle typene er håndtert. */
function describeEvent(event: IncidentEvent): string {
  switch (event.type) {
    case 'reported':
      return event.payload.title;
    case 'assigned':
      return event.payload.assigneeId ?? 'ingen';
    case 'statusChanged':
      return event.payload.status;
    case 'noteAdded':
      return event.payload.text;
    case 'merged':
      return event.payload.mergedIncidentId;
    default: {
      const unreachable: never = event;
      return unreachable;
    }
  }
}

describe('typene', () => {
  it('snevrer inn payload etter type og håndterer alle typene', () => {
    for (const event of normalStream) {
      expect(typeof describeEvent(event)).toBe('string');
    }
  });

  it('avviser feil payload og ugyldige verdier ved kompilering', () => {
    const base = {
      eventId: 'e-x',
      seq: 1,
      incidentId: 'inc-x',
      occurredAt: '2026-07-04T21:47:00Z',
    };

    const wrongPayload: IncidentEvent = {
      ...base,
      type: 'assigned',
      // @ts-expect-error assigned har assigneeId, ikke status
      payload: { status: 'resolved' },
    };

    const wrongStatus: IncidentEvent = {
      ...base,
      type: 'statusChanged',
      // @ts-expect-error 'closed' er ikke en gyldig status
      payload: { status: 'closed' },
    };

    // @ts-expect-error alvorlighet går fra 1 til 4
    const wrongSeverity: Severity = 5;

    expect([wrongPayload, wrongStatus, wrongSeverity]).toHaveLength(3);
  });
});

describe('normalStream', () => {
  it('dekker alle type-verdiene i IncidentEvent', () => {
    const types = new Set(normalStream.map((event) => event.type));
    expect([...types].sort()).toEqual([...INCIDENT_EVENT_TYPES].sort());
  });

  it('har seq som øker med 1 fra 1', () => {
    expect(seqs(normalStream)).toEqual(range(1, normalStream.length));
  });

  it('har unike eventId-er', () => {
    const ids = normalStream.map((event) => event.eventId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('har gyldige tidspunkt som aldri går bakover', () => {
    const times = normalStream.map((event) => Date.parse(event.occurredAt));
    expect(times.every((time) => !Number.isNaN(time))).toBe(true);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('melder en hendelse før noe annet skjer med den', () => {
    const reported = new Set<string>();
    for (const event of normalStream) {
      if (event.type === 'reported') {
        reported.add(event.incidentId);
      } else {
        expect(reported, `${event.eventId} kom før reported`).toContain(event.incidentId);
      }
    }
  });
});

describe('duplicateStream', () => {
  it('har minst én eventId som forekommer to ganger', () => {
    const ids = duplicateStream.map((event) => event.eventId);
    expect(new Set(ids).size).toBeLessThan(ids.length);
  });

  it('gjentar duplikater som identiske kopier', () => {
    const firstById = new Map<string, IncidentEvent>();
    for (const event of duplicateStream) {
      const first = firstById.get(event.eventId);
      if (first) {
        expect(event).toEqual(first);
      } else {
        firstById.set(event.eventId, event);
      }
    }
  });
});

describe('outOfOrderStream', () => {
  it('har minst én hendelse med lavere seq enn den før', () => {
    const s = seqs(outOfOrderStream);
    expect(s.some((seq, i) => i > 0 && seq < s[i - 1])).toBe(true);
  });

  it('mister ingenting: alle seq fra 1 kommer nøyaktig én gang', () => {
    expect([...seqs(outOfOrderStream)].sort((a, b) => a - b)).toEqual(
      range(1, outOfOrderStream.length),
    );
  });
});

describe('gapStream', () => {
  it('mangler minst ett seq som aldri kommer', () => {
    expect(missingSeqs(gapStream).length).toBeGreaterThan(0);
  });

  it('er lik outOfOrderStream utenom hendelsene som mangler', () => {
    const missing = new Set(missingSeqs(gapStream));
    expect(gapStream).toEqual(outOfOrderStream.filter((event) => !missing.has(event.seq)));
  });
});

describe('alle strømmer', () => {
  it.each(Object.entries(allStreams))(
    '%s viser bare til hendelser som er meldt i samme strøm',
    (_, stream) => {
      const reported = new Set(
        stream.filter((event) => event.type === 'reported').map((event) => event.incidentId),
      );
      for (const event of stream) {
        expect(reported).toContain(event.incidentId);
        if (event.type === 'merged') {
          expect(reported).toContain(event.payload.mergedIncidentId);
        }
      }
    },
  );

  it.each(Object.entries(allStreams))('%s bruker bare oppdiktede vakt-id-er', (_, stream) => {
    for (const event of stream) {
      if (event.type === 'assigned' && event.payload.assigneeId !== null) {
        expect(event.payload.assigneeId).toMatch(/^vakt-\d{2}$/);
      }
    }
  });
});
