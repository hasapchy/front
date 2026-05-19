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

export function buildPaymentStatusHtml(item, t, escapeHtml) {
  if (isWarehouseReceiptPaymentNotApplicable(item)) {
    const label = t('paymentStatusNotApplicable');
    return `<span class="text-gray-500 dark:text-[var(--text-secondary)]">${escapeHtml(label)}</span>`;
  }

  const { status: paymentStatus } = normalizePaymentStatus(item);
  const paymentStatusText = resolvePaymentStatusLabel(item, t);
  if (!paymentStatusText) {
    return '';
  }

  const paymentStatusClass = paymentStatus === 'paid'
    ? 'text-[#5CB85C] font-medium'
    : paymentStatus === 'partially_paid'
      ? 'text-[#FFA500] font-medium'
      : 'text-[#EE4F47] font-medium';
  const paymentStatusIcon = paymentStatus === 'paid'
    ? 'fas fa-check-circle'
    : paymentStatus === 'partially_paid'
      ? 'fas fa-adjust'
      : 'fas fa-times-circle';
  const safeText = escapeHtml(paymentStatusText);

  return `<span class="${paymentStatusClass}" title="${safeText}"><i class="${paymentStatusIcon} mr-1"></i>${safeText}</span>`;
}

export function buildAmountWithPaymentStatusFooter(totalPlain, paymentHtml, escapeHtml) {
  if (!paymentHtml) {
    return totalPlain ?? '';
  }
  const safeTotal = escapeHtml(String(totalPlain ?? ''));
  return `<span class="flex w-full min-w-0 flex-nowrap items-center justify-between gap-2"><span class="min-w-0 flex-1 truncate">${paymentHtml}</span><span class="shrink-0 whitespace-nowrap text-right text-sm font-bold text-[var(--nav-accent)] dark:text-[#5CB85C]">${safeTotal}</span></span>`;
}
