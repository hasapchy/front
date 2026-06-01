const FINGERPRINT_KEY = "hasap_web_device_fingerprint";

function randomFingerprint() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateWebDeviceFingerprint() {
  let value = localStorage.getItem(FINGERPRINT_KEY);
  if (!value) {
    value = randomFingerprint();
    localStorage.setItem(FINGERPRINT_KEY, value);
  }
  return value.slice(0, 64);
}

export function getWebDeviceName() {
  if (typeof navigator === "undefined") {
    return "Web browser";
  }
  const ua = navigator.userAgent || "";
  let browser = "Browser";
  if (ua.includes("Edg/")) {
    browser = "Edge";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("Safari/")) {
    browser = "Safari";
  }
  let os = "";
  if (ua.includes("Windows")) {
    os = "Windows";
  } else if (ua.includes("Mac OS")) {
    os = "macOS";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
  }
  return os ? `${browser}, ${os}` : browser;
}

export function getWebDeviceHeaders() {
  return {
    "X-Device-Fingerprint": getOrCreateWebDeviceFingerprint(),
    "X-Device-Name": getWebDeviceName(),
  };
}
