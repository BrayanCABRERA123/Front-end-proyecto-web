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
├── layout/       barra de navegación
└── shared/       componentes, diálogos, pipes y datos comunes
src/assets/i18n/  textos en es, en, fr y pt
src/styles/       tema, variables y mixins de diseño adaptable (mobile ≤ 768 px, tablet ≤ 1024 px)
```

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
