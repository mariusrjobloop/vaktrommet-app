import { IncidentCategory, IncidentStatus, Severity } from './incident';

/** Felles for alle hendelser, uansett type. */
interface IncidentEventBase {
  /** Unik per melding. Samme eventId to ganger er et duplikat. */
  readonly eventId: string;
  /** Øker med 1 per melding fra kilden. Avslører hull og feil rekkefølge. */
  readonly seq: number;
  readonly incidentId: string;
  /** ISO 8601-tidspunkt for når det skjedde, ikke når meldingen kom fram. */
  readonly occurredAt: string;
}

export interface ReportedEvent extends IncidentEventBase {
  readonly type: 'reported';
  readonly payload: {
    readonly title: string;
    readonly category: IncidentCategory;
    readonly severity: Severity;
    readonly zoneId: string;
  };
}

export interface AssignedEvent extends IncidentEventBase {
  readonly type: 'assigned';
  /** null betyr at tildelingen er fjernet. */
  readonly payload: { readonly assigneeId: string | null };
}

export interface StatusChangedEvent extends IncidentEventBase {
  readonly type: 'statusChanged';
  readonly payload: { readonly status: IncidentStatus };
}

export interface NoteAddedEvent extends IncidentEventBase {
  readonly type: 'noteAdded';
  readonly payload: { readonly text: string };
}

/** Hendelsen mergedIncidentId slås inn i incidentId, som er den som beholdes. */
export interface MergedEvent extends IncidentEventBase {
  readonly type: 'merged';
  readonly payload: { readonly mergedIncidentId: string };
}

/** Noe som har skjedd. Feltet type avgjør hvilken payload hendelsen har. */
export type IncidentEvent =
  ReportedEvent | AssignedEvent | StatusChangedEvent | NoteAddedEvent | MergedEvent;

export type IncidentEventType = IncidentEvent['type'];

/** Alle type-verdiene, slik at testene kan sjekke dekning mens programmet kjører. */
export const INCIDENT_EVENT_TYPES = [
  'reported',
  'assigned',
  'statusChanged',
  'noteAdded',
  'merged',
] as const satisfies readonly IncidentEventType[];
