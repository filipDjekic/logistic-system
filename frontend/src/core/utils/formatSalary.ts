export function getSalaryCurrencyCode(currencyCode?: string | null) {
  return currencyCode?.trim().toUpperCase() || 'RSD';
}

export function formatSalary(value: number | null | undefined, currencyCode?: string | null) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  const normalizedCurrencyCode = getSalaryCurrencyCode(currencyCode);

  try {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: normalizedCurrencyCode,
      currencyDisplay: 'code',
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${Number(value).toLocaleString('sr-RS', { maximumFractionDigits: 2 })} ${normalizedCurrencyCode}`;
  }
}
