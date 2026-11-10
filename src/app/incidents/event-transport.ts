import { Observable } from 'rxjs';
import { IncidentEvent } from './incident-event';

/**
 * Kilden for hendelser. Nå er det simulatoren; senere kan det være en Web Worker eller en
 * WebSocket (modul 6). Store-en skal bare kjenne dette grensesnittet.
 */
export interface EventTransport {
  /** Varm strøm: en lytter som kobler seg på sent, får bare det som sendes etterpå. */
  readonly events$: Observable<IncidentEvent>;
}
