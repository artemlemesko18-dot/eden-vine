const NBSP = String.fromCharCode(0xa0);

/**
 * Русская экранная типографика: неразрывные пробелы после коротких слов,
 * перед длинным тире, между числом и единицей, внутри разрядов.
 */
export function typo(input: string): string {
  return input
    .replace(/(?<=^|[\s«„(—-])([А-Яа-яЁёA-Za-z]{1,2}) /g, `$1${NBSP}`)
    .replace(/ (же|ли|бы|ль)(?=[\s.,!?…»]|$)/g, `${NBSP}$1`)
    .replace(/ —/g, `${NBSP}—`)
    .replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`)
    .replace(/(\d) (?=[А-Яа-яЁё%°₽×])/g, `$1${NBSP}`)
    // Короткое последнее слово не остаётся одно на строке
    .replace(/ ([А-Яа-яЁё]{1,4}[.!?…»]*)$/, `${NBSP}$1`);
}

/** Рекурсивно применяет typo ко всем строкам объекта контента. */
export function typographDeep<T>(value: T): T {
  if (typeof value === 'string') return typo(value) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => typographDeep(item)) as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = typographDeep(v);
    }
    return out as T;
  }
  return value;
}

const priceFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

export function formatNumber(value: number, decimals = 0): string {
  if (decimals === 0) return priceFormatter.format(Math.round(value)).replace(/\s/g, NBSP);
  return value.toFixed(decimals).replace('.', ',');
}
