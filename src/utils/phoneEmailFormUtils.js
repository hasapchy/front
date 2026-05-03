import {
  DEFAULT_PHONE_COUNTRY_ID,
  detectCountryIdByPhone,
  getCountryById,
  stripDialCodeFromDigits,
} from "@/constants/phoneCountries";
import { phoneNumberUtil } from "@/utils/phoneLibPhoneNumber";

export { stripDialCodeFromDigits as formatPhoneForInput, detectCountryIdByPhone as getPhoneCountryId };

function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function logPhoneValidation(payload) {
  if (!import.meta.env.DEV) {
    return;
  }
  console.debug("[phoneValidation]", payload);
}

function tryBuildPhoneForCountry(digits, country) {
  const dial = country.dialCode;
  const iso = String(country.id || "").toUpperCase();
  const minNat = country.localLengthMin ?? country.localLengthMax;
  const maxNat = country.localLengthMax;
  const minTotal = dial.length + minNat;
  const maxTotal = dial.length + maxNat;

  if (digits.length < minTotal) {
    logPhoneValidation({
      ok: false,
      reason: "digitsTooShort",
      iso,
      dial,
      digits,
      digitsLen: digits.length,
      minNat,
      maxNat,
      minTotal,
      maxTotal,
      national: stripDialCodeFromDigits(digits),
    });
    return {
      ok: false,
      i18nKey: "phoneNumberLengthWithCountry",
      i18nParams: { length: minTotal },
    };
  }
  if (digits.length > maxTotal) {
    logPhoneValidation({
      ok: false,
      reason: "digitsTooLong",
      iso,
      dial,
      digits,
      digitsLen: digits.length,
      minNat,
      maxNat,
      minTotal,
      maxTotal,
      national: stripDialCodeFromDigits(digits),
    });
    return {
      ok: false,
      i18nKey: "phoneNumberLengthWithCountry",
      i18nParams: { length: maxTotal },
    };
  }
  let national = stripDialCodeFromDigits(digits);
  if (national.length > maxNat) {
    national = national.slice(-maxNat);
  }
  try {
    const num = phoneNumberUtil.parse(national, iso);
    const possible = phoneNumberUtil.isPossibleNumber(num);
    const valid = phoneNumberUtil.isValidNumberForRegion(num, iso);
    if (!possible) {
      logPhoneValidation({
        ok: false,
        reason: "notPossible",
        iso,
        dial,
        digits,
        digitsLen: digits.length,
        minNat,
        maxNat,
        minTotal,
        maxTotal,
        national,
        possible,
        valid,
      });
      return { ok: false, i18nKey: "phoneNumberInvalid", i18nParams: {} };
    }
    const phoneToSave = String(num.getCountryCode()) + String(num.getNationalNumber());
    logPhoneValidation({
      ok: true,
      reason: valid ? "accepted" : "acceptedPossibleOnly",
      iso,
      dial,
      digits,
      digitsLen: digits.length,
      minNat,
      maxNat,
      minTotal,
      maxTotal,
      national,
      possible,
      valid,
      phoneToSave,
    });
    return { ok: true, phoneToSave };
  } catch (err) {
    logPhoneValidation({
      ok: false,
      reason: "parseError",
      iso,
      dial,
      digits,
      digitsLen: digits.length,
      minNat,
      maxNat,
      minTotal,
      maxTotal,
      national,
      message: err && err.message ? err.message : String(err),
    });
    return { ok: false, i18nKey: "phoneNumberInvalid", i18nParams: {} };
  }
}

export function phoneCountryMetaFromFullNumber(phone) {
  const country = getCountryById(detectCountryIdByPhone(phone)) || getCountryById(DEFAULT_PHONE_COUNTRY_ID);
  return { dialCode: country.dialCode, id: country.id };
}

export function hasPhoneShorterThanMinDigits(phones, minLen = 6) {
  return (phones || []).some((p) => phoneDigits(p).length < minLen);
}

export function validateAndNormalizeNewPhone(newPhoneRaw, currentPhoneCountry, existingPhones) {
  if (!String(newPhoneRaw ?? "").trim()) {
    return { ok: false };
  }
  const digits = phoneDigits(newPhoneRaw);
  const country = getCountryById(currentPhoneCountry?.id || DEFAULT_PHONE_COUNTRY_ID)
    || getCountryById(DEFAULT_PHONE_COUNTRY_ID);
  const built = tryBuildPhoneForCountry(digits, country);
  if (!built.ok) {
    return built;
  }
  if (existingPhones.includes(built.phoneToSave)) {
    return { ok: false, i18nKey: "phoneNumberDuplicate" };
  }
  return {
    ok: true,
    phoneToSave: built.phoneToSave,
    countryMeta: { dialCode: country.dialCode, id: country.id },
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
  const savedLocal = phoneDigits(stripDialCodeFromDigits(savedFullPhone));
  const savedCountryId = detectCountryIdByPhone(savedFullPhone);
  const editedLocal = phoneDigits(String(editedDisplay || ""));
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
  const edited = String(editedPhoneRaw).trim();
  if (!edited) {
    return { ok: false, i18nKey: "phoneNumberRequired" };
  }
  const digits = phoneDigits(edited);
  const editedNational = phoneDigits(stripDialCodeFromDigits(edited));
  const storedNational = phoneDigits(stripDialCodeFromDigits(currentStoredPhone));
  const countryIdForSave = selectedCountry?.id || detectCountryIdByPhone(currentStoredPhone);
  if (
    editedNational === storedNational
    && countryIdForSave === detectCountryIdByPhone(currentStoredPhone)
  ) {
    return { ok: true, noop: true };
  }
  const country = getCountryById(countryIdForSave) || getCountryById(DEFAULT_PHONE_COUNTRY_ID);
  const revertDisplay = stripDialCodeFromDigits(currentStoredPhone);
  const built = tryBuildPhoneForCountry(digits, country);
  if (!built.ok) {
    return { ...built, revertDisplay };
  }
  if (
    existingPhones.includes(built.phoneToSave)
    && existingPhones[currentIndex] !== built.phoneToSave
  ) {
    return {
      ok: false,
      i18nKey: "phoneNumberDuplicate",
      revertDisplay,
    };
  }
  return {
    ok: true,
    phoneToSave: built.phoneToSave,
    countryMeta: { dialCode: country.dialCode, id: country.id },
  };
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
      (e, i) => i !== currentIndex && String(e).toLowerCase() === normalized,
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
    editingPhones: list.map((p) => stripDialCodeFromDigits(p.phone)),
    editingPhoneCountries: list.map((p) => phoneCountryMetaFromFullNumber(p.phone)),
  };
}
