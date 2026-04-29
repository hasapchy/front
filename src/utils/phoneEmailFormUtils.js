import {
  DEFAULT_PHONE_COUNTRY_ID,
  getCountryById,
} from "@/constants/phoneCountries";

export const PHONE_FULL_LENGTH = getCountryById(DEFAULT_PHONE_COUNTRY_ID).dialCode.length
  + getCountryById(DEFAULT_PHONE_COUNTRY_ID).localLength;

function detectCountryIdByPhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  if (cleaned.startsWith("971")) {
    return "ae";
  }
  if (cleaned.startsWith("993")) {
    return "tm";
  }
  if (cleaned.startsWith("90")) {
    return "tr";
  }
  if (cleaned.startsWith("7")) {
    return "ru";
  }
  return DEFAULT_PHONE_COUNTRY_ID;
}

function stripKnownPhonePrefix(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  if (cleaned.startsWith("971")) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith("993")) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith("90")) {
    return cleaned.slice(2);
  }
  if (cleaned.startsWith("7")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export function formatPhoneForInput(phone) {
  return stripKnownPhonePrefix(phone);
}

export function getPhoneCountryId(phone) {
  return detectCountryIdByPhone(phone);
}

export function phoneCountryMetaFromFullNumber(phone) {
  const country = getCountryById(detectCountryIdByPhone(phone));
  return { dialCode: country.dialCode, id: country.id };
}

export function hasPhoneShorterThanMinDigits(phones, minLen = 6) {
  return (phones || []).some((p) => String(p).replace(/\D/g, "").length < minLen);
}

export function validateAndNormalizeNewPhone(newPhoneRaw, currentPhoneCountry, existingPhones) {
  if (!newPhoneRaw || !String(newPhoneRaw).trim()) {
    return { ok: false };
  }
  const cleanedPhone = String(newPhoneRaw).replace(/\D/g, "");
  const selectedCountry = getCountryById(currentPhoneCountry?.id || DEFAULT_PHONE_COUNTRY_ID);
  const expectedLength = selectedCountry.dialCode.length + selectedCountry.localLength;

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

  const selectedDialCode = selectedCountry.dialCode;
  const selectedLocalLength = selectedCountry.localLength;
  let phoneWithoutCode = stripKnownPhonePrefix(cleanedPhone);
  if (phoneWithoutCode.length > selectedLocalLength) {
    phoneWithoutCode = phoneWithoutCode.slice(-selectedLocalLength);
  }
  let phoneToSave = selectedDialCode + phoneWithoutCode;

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
    countryMeta: { dialCode: selectedDialCode, id: selectedCountry.id },
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

  const activeCountry = getCountryById(selectedCountry?.id || detectCountryIdByPhone(currentStoredPhone));
  let phoneWithoutCode = stripKnownPhonePrefix(cleanedPhone);
  const dialCode = activeCountry.dialCode;
  const expectedLocalLength = activeCountry.localLength;

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
  const expectedFullLength = dialCode.length + expectedLocalLength;

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

  const countryMeta = { dialCode, id: activeCountry.id };

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
