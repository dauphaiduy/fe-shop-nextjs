import dayjs from "dayjs";

export function formatDate(dateString: string): string {
  return dayjs(dateString).format("MMM D, YYYY");
}

export function formatDateTime(dateString: string): string {
  return dayjs(dateString).format("MMM D, YYYY hh:mm A");
}

export function formatPrice(value: string | number): string {
  return `$${Number(value).toFixed(2)}`;
}
