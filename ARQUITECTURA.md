ñ# Reorganización de arquitectura — MVVM + Feature Based

> Documento para el equipo (aprendices SENA). Explica qué cambió en la estructura de carpetas del proyecto, por qué, y cómo seguir trabajando con el nuevo orden.
>
> **Importante:** el proyecto sigue sin terminar. Esto no es una funcionalidad nueva ni una pantalla nueva — es una reorganización de cómo está guardado el código para que cumpla de verdad con MVVM + Feature Based, que es la arquitectura que se definió para el proyecto.

---

## 1. ¿Por qué se hizo este cambio?

El instructor revisó el proyecto y señaló que faltaban carpetas. Al revisar el código encontramos que:

- Existían carpetas `viewmodels/` (una por cada feature: `auth`, `client`, `operator`, `admin`) pero estaban **vacías y sin usar en ninguna parte** — eran solo el esqueleto que deja Angular al generar un componente, nunca se conectaron a nada.
- Los datos "de negocio" (usuarios, reservas, notificaciones, calificaciones, servicios...) estaban **escritos a mano dentro de cada componente** (`home.ts`, `profile.ts`, etc.), mezclados con la lógica de la vista.
- `core/services/api.ts` y `core/services/auth.ts` existían pero estaban **completamente vacíos** (`export class Api {}`).
- No existía ninguna carpeta `models`/`interfaces` para definir la forma de los datos (Usuario, Reserva, etc.).
- No existía carpeta `environments` para separar configuración de desarrollo/producción (por ejemplo, la URL de la API).

Es decir: la carpeta se llamaba MVVM, pero el patrón no se estaba aplicando de verdad. Todo vivía en la Vista.

---

## 2. La arquitectura, explicada

MVVM separa el código en 3 capas, y en Feature Based cada módulo de la app (`auth`, `client`, `operator`, `admin`) tiene sus propias capas:

```
Vista (Component + .html)  →  ViewModel (estado + lógica de presentación)  →  Service (obtiene los datos)  →  Model (forma del dato)
```

- **Model**: una `interface` de TypeScript. Solo describe la forma de un dato (qué campos tiene y de qué tipo). No tiene lógica.
- **Service**: una clase `@Injectable`. Es la única responsable de conseguir los datos (hoy simulados, mañana desde un backend real). No sabe nada de HTML ni de cómo se muestra la información.
- **ViewModel**: una clase `@Injectable` **propia de cada página**. Le pide los datos al Service, los guarda en `signal()` (el estado reactivo de Angular) y expone métodos para que la Vista los use. No importa nada de Angular Material ni maneja el DOM.
- **Vista (Component)**: el `.ts` + `.html` de cada página. Solo se encarga de mostrar lo que el ViewModel expone y de reaccionar a clics/inputs. Ya no guarda datos "quemados".

### ¿Por qué el ViewModel quedó dentro de cada página y no en una carpeta `viewmodels/` aparte?

Las carpetas `viewmodels/` originales eran **una sola por feature** (ej. un solo `client.viewmodel.ts` para toda la feature `client`, que tiene 6 páginas). Eso no alcanza: cada página (`home`, `profile`, `history`...) tiene su propio estado y no debería compartir un ViewModel con las demás. Por eso ahora cada página tiene su **propio** archivo `xxx.viewmodel.ts` al lado de su `.ts` y su `.html`, por ejemplo:

```
pages/home/
  home.ts            ← Vista
  home.html          ← Vista
  home.viewmodel.ts  ← ViewModel (nuevo)
```

Esto es más fácil de mantener: si tocas `home`, todo lo relacionado a `home` está junto.

### ¿Por qué el formulario de login/registro no tiene un ViewModel aparte?

En Angular, los formularios reactivos (`FormGroup`) necesitan vivir en el componente porque el `.html` se enlaza directamente a ellos (`[formGroup]`). Ahí el componente **sí actúa como su propio ViewModel** — eso es válido en Angular, no hace falta duplicarlo en otra clase. Lo que **no** era válido es que el componente tuviera datos de negocio quemados (como el usuario/contraseña de prueba). Eso se movió al Service (ver sección 4).

---

## 3. Qué se agregó (carpetas y archivos nuevos)

### `src/environments/` (carpeta nueva)

| Archivo | Función |
|---|---|
| `environment.ts` | Configuración para desarrollo. Define `apiUrl: 'http://localhost:3000/api'`. |
| `environment.prod.ts` | Configuración para producción (se activa sola al hacer build de producción, ver sección 6). |

También se editó `angular.json` para que el build de producción reemplace automáticamente `environment.ts` por `environment.prod.ts` (`fileReplacements`).

### `src/app/core/models/` (carpeta nueva — modelos compartidos por toda la app)

| Archivo | Función |
|---|---|
| `usuario.model.ts` | Define la interface `Usuario` (nombre, email, teléfono, dirección, etc.) y la función `obtenerIniciales(nombre)` para calcular las iniciales sin tener que guardarlas como dato aparte. |
| `notificacion.model.ts` | Define la interface `Notificacion` (icon, title, desc, date, read), usada por el componente compartido de notificaciones. |
| `credenciales.model.ts` | Define `Credenciales` (correo, contraseña) y `DatosRegistro` (nombre, correo, teléfono, contraseña), usadas por el módulo de autenticación. |

### `src/app/core/services/` (ya existían, estaban vacíos → ahora implementados)

| Archivo | Función |
|---|---|
| `api.ts` | Wrapper genérico sobre `HttpClient` de Angular. Expone `get/post/put/delete` apuntando a `environment.apiUrl`. Hoy no lo usa nadie todavía (ver sección 6), pero ya queda listo para cuando exista backend real. |
| `auth.ts` | Antes vacío. Ahora tiene `login()`, `registrar()`, `solicitarRecuperacion()`, `verificarCodigo()`, `actualizarContrasena()` y `logout()`. Aquí es donde vive (por ahora simulado) la validación de usuario/contraseña que antes estaba escrita directamente en `login.ts`. |

### Feature `client`

| Archivo | Función |
|---|---|
| `models/reserva.model.ts` | Forma de una reserva próxima del cliente (tipo, vehículo, fecha, estado). |
| `models/servicio-historial.model.ts` | Forma de un servicio en el historial del cliente. |
| `services/client.ts` | `ClientService`: `getUsuario()`, `getProximasReservas()`, `getNotificaciones()`, `getHistorial()`. Hoy devuelve datos simulados con `of(...)`. |
| `pages/home/home.viewmodel.ts` | Estado de la página Home del cliente: usuario y próximas reservas. |
| `pages/profile/profile.viewmodel.ts` | Estado de la página Perfil: usuario (con iniciales ya calculadas). |
| `pages/notifications/notifications.viewmodel.ts` | Estado de la lista de notificaciones del cliente. |
| `pages/history/history.viewmodel.ts` | Estado de los servicios del historial del cliente. |

### Feature `operator`

| Archivo | Función |
|---|---|
| `models/estadistica.model.ts` | Forma de las tarjetas de estadísticas del Home del operario. |
| `models/reserva-pendiente.model.ts` | Forma de una reserva pendiente asignada al operario. |
| `models/servicio-asignado.model.ts` | Forma de un servicio en la pantalla "Servicios Asignados". |
| `models/calificacion.model.ts` | Forma de una calificación recibida por el operario. |
| `models/servicio-historial.model.ts` | Forma de un servicio en el historial del operario. |
| `services/operator.ts` | `OperatorService`: junta todos los datos simulados que antes estaban repartidos en 6 componentes distintos (`getUsuario`, `getNotificaciones`, `getEstadisticasHome`, `getReservasPendientes`, `getServiciosAsignados`, `getCalificaciones`, `getHistorialServicios`, etc.). |
| `pages/home/home.viewmodel.ts` | Estado del Home del operario (nombre, estadísticas, progreso, reservas pendientes). |
| `pages/profile/profile.viewmodel.ts` | Estado del Perfil del operario. |
| `pages/notifications/notifications.viewmodel.ts` | Estado de notificaciones del operario. |
| `pages/assigned-services/assigned-services.viewmodel.ts` | Estado de "Servicios Asignados": lista completa y el servicio seleccionado. |
| `pages/qualifications/qualifications.viewmodel.ts` | Estado de "Calificaciones": lista y estadísticas generales. |
| `pages/service-history/service-history.viewmodel.ts` | Estado del historial de servicios del operario. |

---

## 4. Qué se corrigió

- **`login.ts`**: tenía el usuario/contraseña de prueba (`admin@gmail.com` / `Admin123!`) escritos directamente en el componente y la comparación se hacía ahí mismo. Se movió esa lógica a `Auth.login()`. El componente ahora solo llama al service y reacciona a si funcionó o no.
- **`register.component.ts`**: el "registro" era un `setTimeout` de 1.5s que no hacía nada real. Ahora llama a `Auth.registrar(...)`.
- **`forgot-password.ts`** (y sus 3 pasos hijos): el paso final solo hacía `console.log('Contraseña actualizada — navegar al login')` y no navegaba a ningún lado. Ahora cada paso llama al método correspondiente de `Auth` (`solicitarRecuperacion`, `verificarCodigo`, `actualizarContrasena`) y al final sí navega al login. Esto obligó a cambiar los `@Output()` de `verification-step.ts` y `new-password-step.ts` para que manden el código/contraseña ingresados (antes emitían `void`, es decir, no mandaban ningún dato).
- **`profile.html` del operario**: tenía un `1` suelto después del `</div>` de cierre (un typo) que se estaba renderizando como texto visible en la pantalla de perfil. Se eliminó.
- Se eliminaron las 4 carpetas `features/*/viewmodels/` (auth, client, operator, admin) — confirmamos con una búsqueda en todo el código que ningún archivo las importaba, así que era código muerto.

---

## 5. Lo que se dejó **sin tocar** (a propósito)

No todo necesitaba un ViewModel. Por ejemplo:

- `reserve.ts`, `configuration.ts`, `configuration-operator.ts`, `tasks.ts` y el `dashboard.ts` de admin: no tienen datos propios, solo envuelven a otro componente (el formulario de reserva, el panel de ajustes, etc.) o están vacíos a la espera de que alguien los desarrolle. Crear un ViewModel vacío ahí sería una carpeta de más sin ningún uso real — se agrega cuando ese componente tenga datos que mostrar.
- Componentes como `stats-card`, `service-table`, `qualification-card`, `profile-card`, `history-card`, etc.: reciben todo por `@Input()` y avisan al padre con `@Output()`. Eso ya es correcto en Angular (son componentes "tontos" o presentacionales) y no necesitan ViewModel propio.

---

## 6. ¿De dónde se está consumiendo la API?

**Importante — todavía no se consume ninguna API real.** Ahora mismo no hay backend conectado. Esto es lo que sí existe, listo para cuando el backend esté disponible:

- `src/environments/environment.ts` define `apiUrl: 'http://localhost:3000/api'` (para cuando levanten el backend en local).
- `src/environments/environment.prod.ts` define `apiUrl: 'https://api.tudominio.com/api'` como placeholder para producción (**hay que reemplazarlo por la URL real cuando exista**).
- `src/app/core/services/api.ts` es un wrapper genérico sobre `HttpClient` que ya apunta a `environment.apiUrl` (tiene `get`, `post`, `put`, `delete`), pero **ningún service lo está usando todavía**.

Los datos que ven hoy en la app (`ClientService`, `OperatorService`, `Auth`) están **simulados dentro del mismo service**, usando `of([...]).pipe(delay(200))` de RxJS — eso imita una respuesta asíncrona de una API real, pero es 100% información inventada dentro del código, no viene de ningún servidor.

### Cómo se conectará el backend real más adelante

Cuando exista una API real, el cambio es pequeño porque ya está preparado el molde. Por ejemplo, en `client.ts`:

```ts
// hoy (simulado):
getUsuario(): Observable<Usuario> {
  return of({ nombre: 'Juan Díaz', ... }).pipe(delay(200));
}

// mañana (real), inyectando Api en el constructor:
getUsuario(): Observable<Usuario> {
  return this.api.get<Usuario>('usuarios/me');
}
```

El `ViewModel` y el `Component` **no cambian nada** — ellos solo conocen el `Observable<Usuario>` que devuelve el service, no les importa si viene de `of()` o de un `HttpClient` real. Esa es la ventaja de tener esta separación.

---

## 7. Resumen para el equipo

- Si vas a agregar una pantalla nueva: crea su `models` (si tiene datos propios que otras features no usan), agrega los métodos que necesite al `service` de la feature (o crea uno si la feature no tiene), y crea un `xxx.viewmodel.ts` al lado del `.ts` de la página.
- Si el dato es compartido entre features (como `Usuario`), va en `core/models`, no dentro de una feature.
- Nunca escribas datos "quemados" (arrays, objetos de prueba) directamente en un componente — eso va en el `service` de la feature.
- El proyecto sigue sin terminar: faltan pantallas por conectar a datos reales, falta el backend, y varias páginas (tasks, dashboard de admin, configuración) siguen vacías a propósito porque todavía no se ha definido qué van a mostrar.
