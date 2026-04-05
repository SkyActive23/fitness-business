export function getSportHref(sport: string) {
  const normalized = sport.toLowerCase();

  return normalized === 'baseball'
    ? '/dashboard/athletes/baseball'
    : `/dashboard/athletes/sport/${encodeURIComponent(sport)}`;
}