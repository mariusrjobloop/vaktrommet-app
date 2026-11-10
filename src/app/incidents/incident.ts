export type IncidentCategory = 'medical' | 'crowd' | 'technical' | 'weather' | 'security';

/** 1 er mest kritisk og 4 minst kritisk, som i triage. */
export type Severity = 1 | 2 | 3 | 4;

export type IncidentStatus = 'new' | 'acknowledged' | 'inProgress' | 'resolved';

/**
 * Tilstanden som vises for én hendelse. Den bygges av en rekke IncidentEvent og
 * lagres aldri direkte; se incident-event.ts.
 */
export interface Incident {
  readonly id: string;
  /** Brukes til konflikthåndtering mellom operatører (modul 7). */
  readonly version: number;
  readonly title: string;
  readonly category: IncidentCategory;
  readonly severity: Severity;
  readonly status: IncidentStatus;
  readonly zoneId: string;
  readonly assigneeId: string | null;
  /** Antall rapporter, inkludert dem som er slått sammen inn i denne. */
  readonly reportCount: number;
  readonly updatedAt: string;
}
