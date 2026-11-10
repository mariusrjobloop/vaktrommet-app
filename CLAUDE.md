# Vaktrom

Sanntidsplattform for en festivals operasjonssentral: operatører følger, prioriterer og tildeler hundrevis av samtidige hendelser. Det finnes ingen backend. En simulator i nettleseren sender hendelsene.

Prosjektet er et læringsprosjekt i agentstyrt utvikling. Marius skriver spesifikasjonen, godkjenner planen, leser hver diff og bestemmer hva som merges. Du (agenten) skriver kode, kjører kommandoer og foreslår.

## Stack

- Angular 22 med standalone-komponenter, TypeScript og zoneless/signals
- State: signals (`signal()`, `computed()`) i services, ikke NgRx
- Strøm og batching: RxJS, bare i transportlaget
- Lange lister: Angular CDK Virtual Scroll (kommer i modul 5)
- Tester: Vitest via `ng test` (jsdom). Ende-til-ende: Playwright (kommer i modul 8)
- Styling: vanlig CSS med egne design tokens, ingen UI-bibliotek
- Formatering: Prettier (`.prettierrc`: 100 tegn, enkle anførselstegn)

## Mappestruktur

```
src/app/
  app.ts, app.config.ts, app.routes.ts   Rotkomponent og oppsett
  incidents/                             Domenet: typer, store, komponenter for hendelser
    incident.ts                          Plassholder, erstattes av Incident og IncidentEvent i modul 2
    incident-card.ts                     Uferdig komponent, bygges ut i modul 5
```

Ny kode for hendelser legges i `src/app/incidents/`. Opprett nye toppmapper (for eksempel `simulator/` eller `shared/`) bare når issuet ber om det.

## Kommandoer

| Kommando | Hva |
| --- | --- |
| `npm start` | Utviklingsserver på http://localhost:4200 |
| `npm run build` | Produksjonsbygg til `dist/` |
| `npm test` | Enhetstester i watch-modus |
| `npm run test:ci` | Enhetstester én gang |
| `npm run lint` | ESLint |

Før du sier at en oppgave er ferdig, skal `lint`, `test:ci` og `build` være grønne. Hvis en kommando ikke finnes ennå, skal du si det. Ikke hopp over den i stillhet.

## Angular-konvensjoner

- Standalone-komponenter. Ikke bruk NgModules.
- `input()`, `output()` og `model()`, ikke `@Input()` eller `@Output()`
- Kontrollflyt i malen: `@if`, `@for` (alltid med `track` på en stabil id) og `@switch`, ikke `*ngIf` eller `*ngFor`
- `inject()` i stedet for konstruktør-injeksjon
- `ChangeDetectionStrategy.OnPush` på nye komponenter
- Tilstand oppdateres immutabelt: lag en ny array eller et nytt objekt, aldri mutasjon
- Selektorer har prefikset `app-` (fra `angular.json`)
- Er du i tvil om et API i Angular 22, sjekk https://angular.dev før du skriver koden.

## Arbeidsregler

1. **Endre aldri filer utenfor issuets scope.** Ser du noe som bør fikses andre steder, nevner du det i svaret eller i PR-en. Ikke fiks det.
2. **Én modul er ett issue, én branch og én PR.** Branchnavn: `modul-<nr>-<kort-navn>`. Push aldri direkte til `main`.
3. **Testene først.** Når issuet har akseptkriterier, skriver eller viser du testene før implementasjonen.
4. **Planlegg før du koder.** Legg frem en kort plan med filene du vil endre. Vent på godkjenning.
5. **Ingen nye pakker uten begrunnelse.** Hvis `package.json` endres, skal PR-en forklare hvorfor hver ny pakke trengs.
6. **Ingen hemmeligheter** i koden eller i commits.
7. **Forklar diffen.** I PR-beskrivelsen skal hver fil som er endret ha én linje om hvorfor den er endret.

## Referanser

- Plan for agentkoding (modulene 0–9): https://claude.ai/artifact/Y6VkhUNBEURhRRt2hntgUZ
- Prosjektcase (domene, datamodell, demoscenario): https://claude.ai/artifact/CtgyfuSUVA6xNEG9ToGoqB
