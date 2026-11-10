# VaktromApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Læringslogg

Én blokk per modul, skrevet når PR-en er merget.

### Modul 3 – Simulert hendelsesstrøm

- Prompt som fungerte: «Les planen og casen og legg frem en plan før du koder», og deretter å godkjenne testene før implementasjonen.
- Hva agenten gjorde riktig: delte simulatoren i en ren tidsplan og en RxJS-avspiller, slik at nesten alt kunne testes uten timere. Alle 55 testene ble grønne, og ødelagt kode med vilje ga røde tester.
- Hva jeg måtte rette, og hvordan jeg oppdaget det: svaret mitt om nettbrudd var tvetydig og stred mot issuet. Agenten spurte før den kodet. Jeg la også til et scenario agenten ikke hadde tenkt på: to vaktposter som oppdaterer samme hendelse offline. Det ble lagt inn under modul 7.
- Angular-konsept jeg lærte: varme strømmer (`Subject`) i transportlaget, og falske timere i Vitest for å teste tid.
