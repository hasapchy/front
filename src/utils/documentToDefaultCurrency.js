import AppController from '@/api/AppController';

export function isDocumentCurrencyDefault(documentCurrencyId, currencies) {
  if (documentCurrencyId == null || documentCurrencyId === '') {
    return true;
  }
  const def = (currencies || []).find((c) => c.isDefault);
  if (!def) {
    return false;
  }
  return Number(def.id) === Number(documentCurrencyId);
}

export function exchangeRateDateFromDateTimeLocal(dateTimeLocal) {
  if (dateTimeLocal == null || dateTimeLocal === '') {
    return null;
  }
  const raw = String(dateTimeLocal).trim();
  if (!raw) {
    return null;
  }
  if (raw.includes('T')) {
    return raw.slice(0, 10);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

export async function fetchDocumentToDefaultFactor(documentCurrencyId, currencies, rateDate = null) {
  if (isDocumentCurrencyDefault(documentCurrencyId, currencies)) {
    return 1;
  }
  try {
    const dateParam = rateDate ? exchangeRateDateFromDateTimeLocal(rateDate) ?? rateDate : null;
    const data = await AppController.getCurrencyExchangeRate(documentCurrencyId, dateParam);
    const rate = parseFloat(data?.exchangeRate);
    return rate > 0 ? rate : 1;
  } catch {
    return 1;
  }
}

export function documentAmountToDefault(amount, factor) {
  const n = Number(amount) || 0;
  const f = Number(factor) || 1;
  return n * f;
}

export function resolveLineSubtotalInDefaultCurrency({
  amountDefault = null,
  lineSubtotalDefault = null,
  priceDefault = null,
  unitPriceInDefault = null,
  quantity = 0,
  documentUnitPrice = null,
  documentLineAmount = null,
  factor = 1,
}) {
  if (amountDefault != null && amountDefault !== '') {
    const fromDb = Number(amountDefault);
    if (fromDb > 0) {
      return fromDb;
    }
  }
  if (lineSubtotalDefault != null && lineSubtotalDefault !== '') {
    const fromLine = Number(lineSubtotalDefault);
    if (fromLine > 0) {
      return fromLine;
    }
  }
  const qty = Number(quantity) || 0;
  if (qty > 0) {
    let unit = unitPriceInDefault != null ? Number(unitPriceInDefault) : NaN;
    if (!Number.isFinite(unit) || unit <= 0) {
      const priceDef = priceDefault != null && priceDefault !== '' ? Number(priceDefault) : NaN;
      if (Number.isFinite(priceDef) && priceDef > 0) {
        unit = priceDef;
      } else {
        const docPrice = Number(documentUnitPrice) || 0;
        if (docPrice > 0) {
          unit = documentAmountToDefault(docPrice, factor);
        }
      }
    }
    if (Number.isFinite(unit) && unit > 0) {
      return unit * qty;
    }
  }
  if (documentLineAmount != null && documentLineAmount !== '') {
    const amount = Number(documentLineAmount) || 0;
    if (amount > 0) {
      return documentAmountToDefault(amount, factor);
    }
  }
  return null;
}

export function defaultAmountToDocument(amountDefault, factor) {
  const n = Number(amountDefault) || 0;
  const f = Number(factor) || 1;
  return f > 0 ? n / f : n;
}

export function logDocumentCurrencyHint(scope, payload) {
  if (import.meta.env.DEV) {
    console.debug(`[document-currency:${scope}]`, payload);
  }
}
