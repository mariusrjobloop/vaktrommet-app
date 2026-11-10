import { IncidentEvent } from './incident-event';

/*
 * Testdata fra demoscenarioet kl. 21:47: regnskyll, trengsel ved Port B og en medisinsk
 * hendelse ved Scene 2. Alt er oppdiktet. Ingen navn eller andre personopplysninger.
 *
 * Hendelser:
 *   inc-port-b-1  Trengsel ved Port B, beholdes
 *   inc-port-b-2  Samme trengsel meldt på nytt, slås inn i inc-port-b-1
 *   inc-scene-2   Medisinsk, alvorlighet 1
 *   inc-scene-1   Vann på scenegulvet
 */

/** Alt i riktig rekkefølge, én gang hver. Dekker alle type-verdiene. */
export const normalStream: readonly IncidentEvent[] = [
  {
    eventId: 'e-001',
    seq: 1,
    incidentId: 'inc-port-b-1',
    occurredAt: '2026-07-04T21:47:05+02:00',
    type: 'reported',
    payload: { title: 'Trengsel ved Port B', category: 'crowd', severity: 2, zoneId: 'port-b' },
  },
  {
    eventId: 'e-002',
    seq: 2,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:47:12+02:00',
    type: 'reported',
    payload: {
      title: 'Person besvimt foran Scene 2',
      category: 'medical',
      severity: 1,
      zoneId: 'scene-2',
    },
  },
  {
    eventId: 'e-003',
    seq: 3,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:47:20+02:00',
    type: 'assigned',
    payload: { assigneeId: 'vakt-03' },
  },
  {
    eventId: 'e-004',
    seq: 4,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:47:25+02:00',
    type: 'statusChanged',
    payload: { status: 'acknowledged' },
  },
  {
    eventId: 'e-005',
    seq: 5,
    incidentId: 'inc-port-b-2',
    occurredAt: '2026-07-04T21:47:31+02:00',
    type: 'reported',
    payload: {
      title: 'Folk presser mot gjerdet ved Port B',
      category: 'crowd',
      severity: 3,
      zoneId: 'port-b',
    },
  },
  {
    eventId: 'e-006',
    seq: 6,
    incidentId: 'inc-port-b-1',
    occurredAt: '2026-07-04T21:47:40+02:00',
    type: 'merged',
    payload: { mergedIncidentId: 'inc-port-b-2' },
  },
  {
    eventId: 'e-007',
    seq: 7,
    incidentId: 'inc-port-b-1',
    occurredAt: '2026-07-04T21:47:48+02:00',
    type: 'assigned',
    payload: { assigneeId: 'vakt-07' },
  },
  {
    eventId: 'e-008',
    seq: 8,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:47:55+02:00',
    type: 'statusChanged',
    payload: { status: 'inProgress' },
  },
  {
    eventId: 'e-009',
    seq: 9,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:48:10+02:00',
    type: 'noteAdded',
    payload: { text: 'Sanitet er på stedet. Pasienten er våken.' },
  },
  {
    eventId: 'e-010',
    seq: 10,
    incidentId: 'inc-scene-1',
    occurredAt: '2026-07-04T21:48:14+02:00',
    type: 'reported',
    payload: {
      title: 'Vann på scenegulvet ved Scene 1',
      category: 'weather',
      severity: 3,
      zoneId: 'scene-1',
    },
  },
  {
    eventId: 'e-011',
    seq: 11,
    incidentId: 'inc-port-b-1',
    occurredAt: '2026-07-04T21:48:30+02:00',
    type: 'assigned',
    payload: { assigneeId: null },
  },
  {
    eventId: 'e-012',
    seq: 12,
    incidentId: 'inc-port-b-1',
    occurredAt: '2026-07-04T21:48:41+02:00',
    type: 'assigned',
    payload: { assigneeId: 'vakt-12' },
  },
  {
    eventId: 'e-013',
    seq: 13,
    incidentId: 'inc-scene-2',
    occurredAt: '2026-07-04T21:49:30+02:00',
    type: 'statusChanged',
    payload: { status: 'resolved' },
  },
];

/** Plukker hendelser fra normalStream i den rekkefølgen seq-ene er oppgitt. */
function bySeq(...seqs: number[]): readonly IncidentEvent[] {
  return seqs.map((seq) => {
    const event = normalStream.find((e) => e.seq === seq);
    if (!event) {
      throw new Error(`normalStream har ikke seq ${seq}`);
    }
    return event;
  });
}

/** e-003 og e-006 kommer to ganger, som identiske kopier. */
export const duplicateStream = bySeq(1, 2, 3, 4, 5, 3, 6, 7, 8, 9, 10, 11, 12, 13, 6);

/**
 * Alt kommer fram, men noe for sent: 3 etter 4, merged (6) før hendelsen den slår inn (5),
 * og 7 etter 8 og 9.
 */
export const outOfOrderStream = bySeq(1, 2, 4, 3, 6, 5, 8, 9, 7, 10, 11, 12, 13);

/**
 * Lik outOfOrderStream, men 7 kommer aldri. I starten ser den ut som feil rekkefølge;
 * bare tiden avgjør at det er et hull.
 */
export const gapStream = bySeq(1, 2, 4, 3, 6, 5, 8, 9, 10, 11, 12, 13);
