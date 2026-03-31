import AppController from "@/api/AppController";

export async function catalogToDocumentMultiplier(documentCurrencyId, currencies) {
  if (documentCurrencyId == null || documentCurrencyId === "") {
    return 1;
  }
  const list = currencies || [];
  const def = list.find((c) => c.isDefault);
  if (!def || Number(def.id) === Number(documentCurrencyId)) {
    return 1;
  }
  try {
    const toData = await AppController.getCurrencyExchangeRate(documentCurrencyId);
    const toRate = parseFloat(toData?.exchangeRate);
    if (!toRate || toRate <= 0) {
      return 1;
    }
    return 1 / toRate;
  } catch {
    return 1;
  }
}
