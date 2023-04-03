export function getTodayString(): string {
  const today = new Date();
  const monthString = (today.getMonth() + 1).toString().padStart(2, '0');
  const dateString = today.getDate().toString().padStart(2, '0');
  return `${today.getFullYear()}${monthString}${dateString}`;
}
