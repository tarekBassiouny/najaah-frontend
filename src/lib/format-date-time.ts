export function formatDateTime(value?: string | number | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
