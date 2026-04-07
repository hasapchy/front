export const PHONE_FULL_LENGTH = 11;

export function formatPhoneForInput(phone) {
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("993")) {
    return cleaned.substring(3);
  }
  if (cleaned.startsWith("7")) {
    return cleaned.substring(1);
  }
  return cleaned;
}

export function getPhoneCountryId(phone) {
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("7")) {
    return "ru";
  }
  return "tm";
}

export function phoneCountryMetaFromFullNumber(phone) {
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("7")) {
    return { dialCode: "7", id: "ru" };
  }
  return { dialCode: "993", id: "tm" };
}

export function hasPhoneShorterThanMinDigits(phones, minLen = 6) {
  return (phones || []).some((p) => String(p).replace(/\D/g, "").length < minLen);
}

export function validateAndNormalizeNewPhone(newPhoneRaw, currentPhoneCountry, existingPhones) {
  if (!newPhoneRaw || !String(newPhoneRaw).trim()) {
    return { ok: false };
  }
  const cleanedPhone = String(newPhoneRaw).replace(/\D/g, "");
  const expectedLength = PHONE_FULL_LENGTH;

  if (cleanedPhone.length < 6) {
    return { ok: false, i18nKey: "phoneNumberMinLength" };
  }
  if (cleanedPhone.length < expectedLength) {
    return {
      ok: false,
      i18nKey: "phoneNumberLengthWithCountry",
      i18nParams: { length: expectedLength },
    };
  }

  let phoneToSave = cleanedPhone;

  if (currentPhoneCountry) {
    if (!cleanedPhone.startsWith(currentPhoneCountry.dialCode)) {
      let phoneWithoutCode = cleanedPhone;
      if (cleanedPhone.startsWith("993")) {
        phoneWithoutCode = cleanedPhone.substring(3);
      } else if (cleanedPhone.startsWith("7")) {
        phoneWithoutCode = cleanedPhone.substring(1);
      }
      phoneToSave = currentPhoneCountry.dialCode + phoneWithoutCode;
    }
  } else if (!cleanedPhone.startsWith("993") && !cleanedPhone.startsWith("7")) {
    phoneToSave = "993" + cleanedPhone;
  }

  if (phoneToSave.length !== expectedLength) {
    return {
      ok: false,
      i18nKey: "phoneNumberLength",
      i18nParams: { length: expectedLength },
    };
  }

  if (existingPhones.includes(phoneToSave)) {
    return { ok: false, i18nKey: "phoneNumberDuplicate" };
  }

  return {
    ok: true,
    phoneToSave,
    countryMeta: currentPhoneCountry || { dialCode: "993", id: "tm" },
  };
}

export function isPhoneEditChanged({
  savedFullPhone,
  editedDisplay,
  editedCountryId,
}) {
  if (savedFullPhone === undefined || editedDisplay === undefined) {
    return false;
  }
  const savedLocal = formatPhoneForInput(savedFullPhone).replace(/\D/g, "");
  const savedCountryId = getPhoneCountryId(savedFullPhone);
  const editedLocal = String(editedDisplay || "").replace(/\D/g, "");
  const countryId = editedCountryId || savedCountryId;
  return editedLocal !== savedLocal || countryId !== savedCountryId;
}

export function trySavePhoneEdit({
  editedPhoneRaw,
  currentStoredPhone,
  selectedCountry,
  existingPhones,
  currentIndex,
}) {
  if (editedPhoneRaw === undefined) {
    return { ok: false };
  }

  const editedPhone = editedPhoneRaw;
  if (!editedPhone || !String(editedPhone).trim()) {
    return { ok: false, i18nKey: "phoneNumberRequired" };
  }

  const cleanedPhone = String(editedPhone).replace(/\D/g, "");
  const currentFormatted = formatPhoneForInput(currentStoredPhone);
  const currentCleaned = currentFormatted.replace(/\D/g, "");

  if (cleanedPhone === currentCleaned) {
    return { ok: true, noop: true };
  }

  let phoneWithoutCode = cleanedPhone;
  if (cleanedPhone.startsWith("993")) {
    phoneWithoutCode = cleanedPhone.substring(3);
  } else if (cleanedPhone.startsWith("7")) {
    phoneWithoutCode = cleanedPhone.substring(1);
  }

  let dialCode = "993";
  let expectedLocalLength = 8;

  if (selectedCountry && selectedCountry.dialCode) {
    dialCode = selectedCountry.dialCode;
    expectedLocalLength = dialCode === "7" ? 10 : 8;
  } else {
    const currentCleanedFull = String(currentStoredPhone).replace(/\D/g, "");
    if (currentCleanedFull.startsWith("7")) {
      dialCode = "7";
      expectedLocalLength = 10;
    }
  }

  if (phoneWithoutCode.length < expectedLocalLength) {
    return {
      ok: false,
      i18nKey: "phoneNumberLengthWithoutCountry",
      i18nParams: { length: expectedLocalLength },
      revertDisplay: formatPhoneForInput(currentStoredPhone),
    };
  }

  if (phoneWithoutCode.length > expectedLocalLength) {
    phoneWithoutCode = phoneWithoutCode.substring(phoneWithoutCode.length - expectedLocalLength);
  }

  const phoneToSave = dialCode + phoneWithoutCode;
  const expectedFullLength = PHONE_FULL_LENGTH;

  if (phoneToSave.length !== expectedFullLength) {
    return {
      ok: false,
      i18nKey: "phoneNumberLengthWithCountry",
      i18nParams: { length: expectedFullLength },
      revertDisplay: formatPhoneForInput(currentStoredPhone),
    };
  }

  if (existingPhones.includes(phoneToSave) && existingPhones[currentIndex] !== phoneToSave) {
    return {
      ok: false,
      i18nKey: "phoneNumberDuplicate",
      revertDisplay: formatPhoneForInput(currentStoredPhone),
    };
  }

  const countryMeta =
    dialCode === "7"
      ? { dialCode: "7", id: "ru" }
      : { dialCode: "993", id: "tm" };

  return { ok: true, phoneToSave, countryMeta };
}

export function normalizeEmailOrError(trimmedEmail) {
  const email = String(trimmedEmail).trim();
  const atIndex = email.indexOf("@");
  if (atIndex < 1 || atIndex === email.length - 1) {
    return { ok: false, i18nKey: "invalidEmail" };
  }
  return { ok: true, normalized: email.toLowerCase() };
}

export function tryAddEmail(newEmailTrimmed, existingEmails) {
  if (!newEmailTrimmed || !String(newEmailTrimmed).trim()) {
    return { ok: false };
  }
  const email = String(newEmailTrimmed).trim();
  const parsed = normalizeEmailOrError(email);
  if (!parsed.ok) {
    return parsed;
  }
  if (existingEmails.some((e) => String(e).toLowerCase() === parsed.normalized)) {
    return { ok: false, i18nKey: "emailDuplicate" };
  }
  return { ok: true, normalized: parsed.normalized };
}

export function isEmailEditChanged(savedEmail, editedDisplay) {
  if (savedEmail === undefined || editedDisplay === undefined) {
    return false;
  }
  return String(editedDisplay || "").trim().toLowerCase() !== String(savedEmail || "").toLowerCase();
}

export function trySaveEmailEdit({
  editedRaw,
  currentEmail,
  existingEmails,
  currentIndex,
}) {
  if (editedRaw === undefined) {
    return { ok: false };
  }
  const edited = String(editedRaw).trim();
  if (!edited) {
    return { ok: false, i18nKey: "invalidEmail", revertTo: currentEmail };
  }
  const parsed = normalizeEmailOrError(edited);
  if (!parsed.ok) {
    return { ok: false, i18nKey: parsed.i18nKey, revertTo: currentEmail };
  }
  const normalized = parsed.normalized;
  if (normalized === currentEmail) {
    return { ok: true, noop: true };
  }
  if (
    existingEmails.some(
      (e, i) => i !== currentIndex && String(e).toLowerCase() === normalized
    )
  ) {
    return { ok: false, i18nKey: "emailDuplicate", revertTo: currentEmail };
  }
  return { ok: true, normalized };
}

export function mapApiPhonesToLists(apiPhones) {
  const list = apiPhones || [];
  return {
    phones: list.map((p) => p.phone),
    editingPhones: list.map((p) => formatPhoneForInput(p.phone)),
    editingPhoneCountries: list.map((p) => phoneCountryMetaFromFullNumber(p.phone)),
  };
}
