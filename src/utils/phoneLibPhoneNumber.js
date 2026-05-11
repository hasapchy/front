import libphonenumber from "google-libphonenumber";

export const phoneNumberUtil = libphonenumber.PhoneNumberUtil.getInstance();

export function getNationalLengthBoundsForRegion(iso2) {
  const region = String(iso2 || "").toUpperCase();
  if (!region) {
    return null;
  }
  const meta = phoneNumberUtil.getMetadataForRegion(region);
  if (!meta) {
    return null;
  }
  const desc = meta.getGeneralDesc();
  if (!desc) {
    return null;
  }
  const raw = desc.possibleLengthArray();
  if (!raw || !raw.length || raw[0] === -1) {
    return null;
  }
  const lengths = raw.filter((n) => typeof n === "number" && n > 0);
  if (!lengths.length) {
    return null;
  }
  return { min: Math.min(...lengths), max: Math.max(...lengths) };
}
