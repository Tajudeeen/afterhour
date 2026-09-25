/**
 * Null-safe number formatting helpers for the AfterHours UI.
 * Prevents "Cannot read properties of null (reading 'toFixed')" runtime errors.
 */

export function formatNum(val: number | null | undefined, decimals = 2, fallback = '0.00'): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return fallback;
  }
  return Number(val).toFixed(decimals);
}

export function formatCurrency(val: number | null | undefined, decimals = 2, fallback = '$0.00'): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return fallback;
  }
  return `$${Number(val).toFixed(decimals)}`;
}

export function formatPercent(val: number | null | undefined, decimals = 2, showPlus = true, fallback = '0.00%'): string {
  if (val === null || val === undefined || Number.isNaN(Number(val))) {
    return fallback;
  }
  const n = Number(val);
  const sign = showPlus && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}
