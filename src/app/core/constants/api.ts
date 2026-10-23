// base de todas las llamadas al backend. Es relativa a propósito: en desarrollo
// proxy.conf.json la redirige al microservicio y en producción la atiende el API Gateway
// en el mismo dominio (sin CORS).
export const API_BASE_URL = '/api/v1';
