// fechas de calendario 'aaaa-mm-dd' en hora local: nunca toISOString(), que pasa a UTC
// y en Colombia (UTC-5) corre el día después de las 7 p. m.

/** fecha local aaaa-mm-dd */
export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** hoy, aaaa-mm-dd */
export function todayIso(): string {
  return isoDay(new Date());
}

/** hoy más n días (n negativo = hacia atrás), aaaa-mm-dd */
export function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDay(d);
}
