import intlTelInput from "intl-tel-input";
import { countryTranslations as ruCountryNames } from "intl-tel-input/i18n/ru";

import { getNationalLengthBoundsForRegion } from "@/utils/phoneLibPhoneNumber";

const LOCAL_FLAGS = {
  tm: "/flags/640px-Flag_of_Turkmenistan.svg.png",
  ru: "/flags/640px-Flag_of_Russia.svg.webp",
  kz: "/flags/Flag_of_Kazakhstan.svg.png",
  ae: "/flags/Flag_of_the_United_Arab_Emirates.svg.png",
  tr: "/flags/Flag_of_Turkey.svg.png",
};

const NAME_OVERRIDES = {
  ae: "Дубай (ОАЭ)",
};

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function nationalLengthBoundsForCountry(iso2, dialCode) {
  const fromLib = getNationalLengthBoundsForRegion(iso2);
  if (fromLib) {
    return fromLib;
  }
  const dc = String(dialCode);
  const maxNat = dc === "1" ? 10 : Math.min(14, 15 - dc.length);
  return { min: maxNat, max: maxNat };
}

function buildInputmaskMask(dialCode, natLen) {
  const prefix = String(dialCode)
    .split("")
    .map((d) => `\\${d}`)
    .join("");
  return `${prefix} ${"9".repeat(natLen)}`;
}

function buildDialCodeMaps(countries) {
  const dialCodes = new Set();
  let dialCodeMaxLen = 0;
  const dialCodeToIso2Map = {};
  const addToDialCodeMap = (iso2, dialCode) => {
    if (!iso2 || !dialCode) {
      return;
    }
    if (dialCode.length > dialCodeMaxLen) {
      dialCodeMaxLen = dialCode.length;
    }
    if (!Object.prototype.hasOwnProperty.call(dialCodeToIso2Map, dialCode)) {
      dialCodeToIso2Map[dialCode] = [];
    }
    const iso2List = dialCodeToIso2Map[dialCode];
    if (iso2List.includes(iso2)) {
      return;
    }
    iso2List.push(iso2);
  };
  const sorted = [...countries].sort((a, b) => (a.priority || 0) - (b.priority || 0));
  for (const c of sorted) {
    const dc = c.dialCode;
    if (!dialCodes.has(dc)) {
      dialCodes.add(dc);
    }
    for (let k = 1; k < dc.length; k += 1) {
      addToDialCodeMap(c.iso2, dc.substring(0, k));
    }
    addToDialCodeMap(c.iso2, dc);
    if (c.areaCodes?.length) {
      const rootIso2 = dialCodeToIso2Map[dc][0];
      for (const areaCode of c.areaCodes) {
        for (let j = 1; j < areaCode.length; j += 1) {
          const partialArea = areaCode.substring(0, j);
          addToDialCodeMap(rootIso2, dc + partialArea);
          addToDialCodeMap(c.iso2, dc + partialArea);
        }
        addToDialCodeMap(c.iso2, dc + areaCode);
      }
    }
  }
  return { dialCodes, dialCodeMaxLen, dialCodeToIso2Map };
}

function extractDialPrefix(numericDigits, dialCodesSet, dialCodeToIso2Map, dialCodeMaxLen) {
  let dialCode = "";
  let numericChars = "";
  for (let i = 0; i < numericDigits.length; i += 1) {
    const ch = numericDigits.charAt(i);
    if (!/[0-9]/.test(ch)) {
      break;
    }
    numericChars += ch;
    if (!dialCodeToIso2Map[numericChars]) {
      break;
    }
    if (dialCodesSet.has(numericChars)) {
      dialCode = numericChars;
    }
    if (numericChars.length === dialCodeMaxLen) {
      break;
    }
  }
  return dialCode;
}

const raw = intlTelInput.getCountryData();

export const PHONE_COUNTRIES = raw
  .map((c) => {
    const iso2 = c.iso2;
    const dialCode = String(c.dialCode);
    const { min: localLengthMin, max: localLengthMax } = nationalLengthBoundsForCountry(iso2, dialCode);
    return {
      id: iso2,
      code: `+${dialCode}`,
      dialCode,
      areaCodes: c.areaCodes || null,
      name: NAME_OVERRIDES[iso2] || ruCountryNames[iso2] || c.name,
      flag: LOCAL_FLAGS[iso2] || `https://flagcdn.com/20x15/${iso2}.png`,
      mask: buildInputmaskMask(dialCode, localLengthMax),
      localLengthMin,
      localLengthMax,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "ru", { sensitivity: "base" }));

export const DEFAULT_PHONE_COUNTRY_ID = "tm";

const PHONE_COUNTRIES_BY_ID = Object.fromEntries(
  PHONE_COUNTRIES.map((country) => [country.id, country]),
);

function pickIsoForDial(numericDigits, dialCode, dialCodeToIso2Map) {
  const list = dialCodeToIso2Map[dialCode];
  if (!list?.length) {
    return null;
  }
  if (list.length === 1) {
    return list[0];
  }
  for (const iso2 of list) {
    const c = PHONE_COUNTRIES_BY_ID[iso2];
    if (!c?.areaCodes?.length) {
      continue;
    }
    const dialCodeAreaCodes = c.areaCodes.map((ac) => `${c.dialCode}${ac}`);
    if (dialCodeAreaCodes.some((dac) => numericDigits.startsWith(dac))) {
      return iso2;
    }
  }
  return list[0];
}

const { dialCodes, dialCodeMaxLen, dialCodeToIso2Map } = buildDialCodeMaps(raw);

/**
 * @param {string} countryId
 * @returns {(typeof PHONE_COUNTRIES)[number]|undefined}
 */
export function getCountryById(countryId) {
  return PHONE_COUNTRIES_BY_ID[countryId];
}

/**
 * @param {string} phone
 * @returns {string}
 */
export function detectCountryIdByPhone(phone) {
  const cleaned = digitsOnly(phone);
  if (!cleaned) {
    return DEFAULT_PHONE_COUNTRY_ID;
  }
  const dial = extractDialPrefix(cleaned, dialCodes, dialCodeToIso2Map, dialCodeMaxLen);
  if (!dial) {
    return DEFAULT_PHONE_COUNTRY_ID;
  }
  const iso = pickIsoForDial(cleaned, dial, dialCodeToIso2Map);
  return iso || DEFAULT_PHONE_COUNTRY_ID;
}

/**
 * @param {string} phone
 * @returns {string}
 */
export function stripDialCodeFromDigits(phone) {
  const cleaned = digitsOnly(phone);
  const dial = extractDialPrefix(cleaned, dialCodes, dialCodeToIso2Map, dialCodeMaxLen);
  if (!dial) {
    return cleaned;
  }
  return cleaned.slice(dial.length);
}
