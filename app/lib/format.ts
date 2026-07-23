/**
 * Детерміноване форматування — однакове на сервері й на клієнті.
 *
 * Без явної локалі й таймзони Node у контейнері (UTC, en-US) і браузер
 * (системна локаль користувача) дають різні рядки, і React падає з
 * "server rendered text didn't match the client" під час гідратації.
 */

const LOCALE = 'en-US';

const numberFormatter = new Intl.NumberFormat(LOCALE);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
});

/** 52341 → "52,341" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

type DateInput = string | number | Date | null | undefined;

/** Intl кидає RangeError на Invalid Date, а API не гарантують поле:
    GitLab, наприклад, не віддає created_at для юзерів під неадмінським токеном. */
function toValidDate(value: DateInput): Date | null {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO-рядок або timestamp → "5/14/2020"; null, якщо дати немає або вона невалідна */
export function formatDate(value: DateInput): string | null {
  const date = toValidDate(value);
  return date && dateFormatter.format(date);
}

/** ISO-рядок або timestamp → "May 14" (для осей графіків) */
export function formatShortDate(value: DateInput): string | null {
  const date = toValidDate(value);
  return date && shortDateFormatter.format(date);
}
