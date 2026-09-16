# Web

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.3.

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

## Mock API (json-server + JWT)

The instructor recommended generating a JSON file with the database structure and using [json-server](https://github.com/typicode/json-server) to simulate a REST API, so the frontend can be demoed while the real backend/microservices are still being built. This is temporary and will be replaced once the real backend is ready.

### How to run

In one terminal, start the mock API:

```bash
npm run mock-api
```

This runs `mock-api/server.cjs`, which serves `mock-api/db.json` on `http://localhost:3000` and adds a custom `POST /login` route that returns a JWT.

In another terminal, start the Angular app as usual:

```bash
npm start
```

### Screens currently consuming the mock API

- **Operator home** (`/operator`): loads today's reservations for the operator.
- **Client vehicles** (`/client/vehicles`): loads, adds, and deletes vehicles for the client.
- **Login** (`/login`): authenticates against the mock `/login` endpoint and stores the returned JWT.

### Demo login credentials

Use these to log in through the UI:

- **Email:** `demo.cliente@gmail.com`
- **Password:** `Demo123`

The other seed users (`camilo.operario@lavadovehicular.com`, `juan@email.com`, `laura.admin@lavadovehicular.com`) exist in `db.json` only to provide the `operatorId`/`customerId` foreign keys used by the seeded reservations and vehicles — they won't pass the login form's `@gmail.com`-only email validator, so they can't be used to log in through the UI.
