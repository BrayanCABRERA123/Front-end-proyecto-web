# syntax=docker/dockerfile:1

# ---- Build ---------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# primero las dependencias: esta capa se reutiliza hasta que cambie package-lock.json
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx ng build --configuration production

# ---- Runtime -------------------------------------------------------------
# nginx sirve la web y pasa /api al gateway: el navegador ve un solo origen (sin CORS)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 80
