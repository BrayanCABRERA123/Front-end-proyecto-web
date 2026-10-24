# syntax=docker/dockerfile:1

# ---- Build ---------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# primero las dependencias: esta capa se reutiliza hasta que cambie package-lock.json.
# --ignore-scripts (WEB-15): ningún paquete corre código al instalarse; el build no los necesita
# (esbuild, lmdb y @parcel/watcher traen su binario como dependencia opcional ya compilada)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --ignore-scripts

COPY . .
RUN npx ng build --configuration production

# ---- Runtime -------------------------------------------------------------
# nginx sirve la web y pasa /api al gateway: el navegador ve un solo origen (sin CORS).
# H-19: imagen sin root (usuario nginx, uid 101); por eso escucha en 8080 y no en 80
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 8080
