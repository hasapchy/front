import { formatCurrencyForDisplay } from '@/utils/numberUtils';

const PAYMENT_COMPARE_EPSILON = 1e-9;

function normalizePaymentStatus(item) {
  const paidAmount = parseFloat(item?.paidAmount ?? 0) || 0;
  const totalAmount = parseFloat(item?.totalAmount ?? item?.amount ?? 0) || 0;
  const fromApi = item?.paymentStatus;

  if (['paid', 'partially_paid', 'unpaid'].includes(fromApi)) {
    return { status: fromApi, paidAmount, totalAmount };
  }
  if (paidAmount <= PAYMENT_COMPARE_EPSILON) {
    return { status: 'unpaid', paidAmount, totalAmount };
  }
  if (paidAmount + PAYMENT_COMPARE_EPSILON < totalAmount) {
    return { status: 'partially_paid', paidAmount, totalAmount };
  }

  return { status: 'paid', paidAmount, totalAmount };
}

function isWarehouseReceiptPaymentNotApplicable(item) {
  return Boolean(item?.isFromPurchase) && item?.paymentStatus == null;
}

function resolvePaymentStatusLabel(item, t) {
  if (isWarehouseReceiptPaymentNotApplicable(item)) {
    return t('paymentStatusNotApplicable');
  }
  if (item?.paymentStatusText) {
    return item.paymentStatusText;
  }
  const { status } = normalizePaymentStatus(item);
  if (status === 'paid') {
    return t('paid');
  }
  if (status === 'partially_paid') {
    return t('partiallyPaid');
  }
  return t('unpaid');
}

function paymentStatusColor(status) {
  if (status === 'paid') {
    return 'var(--color-success)';
  }
  if (status === 'partially_paid') {
    return 'var(--color-warning)';
  }
  return 'var(--color-danger)';
}

function paymentStatusIconClass(status) {
  if (status === 'paid') {
    return 'fas fa-check-circle';
  }
  if (status === 'partially_paid') {
    return 'fas fa-adjust';
  }
  return 'fas fa-times-circle';
}

function resolveCurrencyCode(item) {
  return item?.origCurrencyCode ?? item?.currencyCode ?? '';
}

/**
 * @param {object} item
 * @param {(key: string) => string} t
 * @param {(value: string) => string} escapeHtml
 * @param {{ iconOnly?: boolean }} [options]
 * @returns {string}
 */
export function buildPaymentStatusHtml(item, t, escapeHtml, options = {}) {
  if (isWarehouseReceiptPaymentNotApplicable(item)) {
    const label = t('paymentStatusNotApplicable');
    return `<span class="text-gray-500 dark:text-[var(--text-secondary)]" title="${escapeHtml(label)}">—</span>`;
  }

  const { status: paymentStatus, paidAmount } = normalizePaymentStatus(item);
  const paymentStatusText = resolvePaymentStatusLabel(item, t);
  if (!paymentStatusText) {
    return '';
  }

  const color = paymentStatusColor(paymentStatus);
  const iconClass = paymentStatusIconClass(paymentStatus);
  const safeTitle = escapeHtml(paymentStatusText);
  const showAmount = paymentStatus === 'partially_paid' && paidAmount > PAYMENT_COMPARE_EPSILON;
  const formattedAmount = showAmount
    ? formatCurrencyForDisplay(paidAmount, resolveCurrencyCode(item), true)
    : '';
  if (options.iconOnly) {
    return `<span style="color:${color};font-weight:bold" title="${safeTitle}"><i class="${iconClass}"></i></span>`;
  }

  const amountHtml = showAmount && formattedAmount
    ? `<span class="ml-1 text-xs font-medium">${escapeHtml(formattedAmount)}</span>`
    : '';

  return `<span style="color:${color};font-weight:bold" title="${safeTitle}"><i class="${iconClass}"></i>${amountHtml}</span>`;
}

export { normalizePaymentStatus, resolvePaymentStatusLabel, paymentStatusColor };

export function buildAmountWithPaymentStatusFooter(totalPlain, paymentHtml, escapeHtml) {
  if (!paymentHtml) {
    return totalPlain ?? '';
  }
  const safeTotal = escapeHtml(String(totalPlain ?? ''));
  return `<span class="flex w-full min-w-0 flex-nowrap items-center justify-between gap-2"><span class="min-w-0 flex-1 truncate">${paymentHtml}</span><span class="shrink-0 whitespace-nowrap text-right text-sm font-bold text-[var(--nav-accent)] dark:text-[var(--color-success)]">${safeTotal}</span></span>`;
}
