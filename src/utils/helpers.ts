export function calculateMasteryLevel(level: number, recentFailures: number): number {
  const baseMastery = Math.max(0.1, 1 - (level / 15));
  const penalty = Math.min(0.3, recentFailures * 0.1);
  return Math.min(0.95, Math.max(0.1, baseMastery - penalty));
}

export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  const result = d.toISOString().split('T')[0];
  return result ?? '';
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
