# LavaRápido — aplicación web

Aplicación web de LavaRápido: página de inicio pública con preguntas frecuentes, registro e inicio
de sesión, y los paneles del cliente (reservas, vehículos, pagos, historial y calificaciones), del
operario (servicios asignados y ejecución) y del administrador (usuarios, catálogo, horarios,
operarios, reservas, informe de inspección, pagos y reportes). Incluye el informe de inspección
público que el cliente abre sin sesión.

Stack: Angular 21 · Angular Material · RxJS · ngx-translate (español, inglés, francés y portugués) · Vitest.

## Cómo correrla

Necesita el backend arriba (`docker compose --profile app up -d` desde `lavarapido-infra`).
En desarrollo, `proxy.conf.json` envía `/api` al API Gateway (`http://localhost:8080`).

```bash
npm install
npm start                 # http://localhost:4200
npm test                  # pruebas unitarias con Vitest
npm run build             # compilación de producción en dist/
```

Cuentas de prueba del perfil `dev` (solo en local): `admin@gmail.com`, `operador@gmail.com` y
`cliente@gmail.com`; las contraseñas están en `GUIA-EQUIPO.md` de `lavarapido-infra`.

## Estructura

```
src/app/
├── core/         guards, interceptors (token y sesión vencida), services, models, constants, utils
├── features/     landing · auth · client · operator · admin · public-report · not-found
└── shared/       componentes, diálogos, pipes y datos comunes
src/assets/i18n/  textos en es, en, fr y pt
src/styles/       tema, variables y mixins de diseño adaptable (mobile ≤ 768 px, tablet ≤ 1024 px)
```

## Arquitectura: por features + MVVM

Cada *feature* (`admin`, `client`, `operator`, `auth`, `landing`, `public-report`) tiene
sus pantallas, y cada pantalla se divide en Vista, ViewModel y Modelo:

```
features/<feature>/
├── pages/<pantalla>/                 VISTA: <pantalla>.ts + .html + .scss
├── viewmodels/<pantalla>.viewmodel.ts   VIEWMODEL: estado (signals) y acciones de la pantalla
├── services/                         estado compartido entre pantallas del rol (stores del admin)
└── <feature>-routing-module.ts
shared/components + shared/dialogs    VISTAS que usan los 3 roles (perfil, notificaciones, menú...)
shared/viewmodels/                    sus VIEWMODELS (ej. profile.viewmodel.ts)
core/models + core/services           MODELO: tipos y llamadas HTTP al gateway
```

- **Vista.** Muestra el estado del ViewModel y le pasa los eventos. Abre los modales (confirmar,
  formularios) y navega, pero no llama a `core/services` ni decide reglas.
- **ViewModel.** Clase `@Injectable()` que se registra en `providers` de su página, así vive y
  muere con la pantalla. Guarda el estado en *signals* (la app es *zoneless*: la vista se repinta
  sola) y expone las acciones; es lo único que habla con `core/services` y los stores. Avisa el
  resultado con `FeedbackService`. No toca HTML.
- **Modelo.** `core/models` (tipos del backend) y `core/services` (un servicio por microservicio).
- Una pantalla con secciones o pasos (la landing, recuperar contraseña) tiene un solo ViewModel
  que registra la página y que inyectan sus secciones.
- Los componentes compartidos con lógica (perfil, notificaciones, configuración, menú lateral y los
  modales que guardan solos) registran su ViewModel en sus propios `providers`.
- Los modales que solo llenan un formulario y devuelven el resultado son parte de la vista.
- Excepciones: la página 404 (lee la sesión para saber a qué inicio llevar) y la miniatura de una
  foto de inspección (carga la imagen con el token) son vistas mínimas sin ViewModel.
- Las pruebas del comportamiento van sobre el ViewModel, sin pantalla.

## Diseño adaptable

Cada pantalla se revisa a 360 px (celular) y 768 px (tableta) sin desbordamiento horizontal
antes de fusionar a `develop`.

## Proyecto LavaRápido

Este repositorio es parte de LavaRápido (Vehicle Washing), proyecto formativo del Tecnólogo en
Análisis y Desarrollo de Software (ADSO), ficha 3145556, SENA Regional Huila.

| Recurso | Enlace |
|---|---|
| Documentación y manuales (ES/EN, MD · PDF · Word) | [lavarapido-docs](https://github.com/BrayanCABRERA123/lavarapido-docs#readme) |
| Manual técnico | [09_MANUALES/ES/MD/manual-tecnico.md](https://github.com/BrayanCABRERA123/lavarapido-docs/blob/main/09_MANUALES/ES/MD/manual-tecnico.md) |
| Manual de instalación | [09_MANUALES/ES/MD/manual-de-instalacion.md](https://github.com/BrayanCABRERA123/lavarapido-docs/blob/main/09_MANUALES/ES/MD/manual-de-instalacion.md) |
| Levantar todo el sistema | [lavarapido-infra](https://github.com/BrayanCABRERA123/lavarapido-infra) (`docker compose --profile app up -d`) |
| Aplicación desplegada | https://lavarapidovehicular.northcentralus.cloudapp.azure.com |

**Ramas y commits:** se trabaja en `develop` con ramas `feature/`, `fix/` y `docs/` que se
fusionan con `git merge --no-ff`; los commits siguen Conventional Commits
(`feat(scope): ...`, `fix(scope): ...`). Detalle en la
[guía de git del equipo](https://github.com/BrayanCABRERA123/lavarapido-docs#guía-de-git-del-equipo).

**Equipo:** Brayan Estiven Patiño Cabrera, Juan Camilo Guilombo Osorio y Merari Urbano Quintero.
