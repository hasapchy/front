import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CACHE_CONFIG } from "../src/cache/config.js";
import {
  GLOBAL_REFERENCE_CACHE_SCHEMA,
  COMPANY_SCOPED_CACHE_SCHEMA,
} from "../src/store/cacheSchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const storeFile = path.resolve(rootDir, "src/store/index.js");

const source = fs.readFileSync(storeFile, "utf8");

const globalKeys = CACHE_CONFIG.globalReferenceKeys || {};
const resolvedKeys = new Set();

for (const schema of Object.values(GLOBAL_REFERENCE_CACHE_SCHEMA)) {
  if (schema?.key) {
    resolvedKeys.add(schema.key);
  }
}
for (const schema of Object.values(COMPANY_SCOPED_CACHE_SCHEMA)) {
  if (schema?.keyPrefix) {
    resolvedKeys.add(`${schema.keyPrefix}_`);
  }
}

const quotedCacheKeyRegex = /cacheKey:\s*["'`]([^"'`]+)["'`]/g;
for (const match of source.matchAll(quotedCacheKeyRegex)) {
  resolvedKeys.add(match[1]);
}

const globalRefRegex = /cacheKey:\s*GLOBAL_CACHE_KEYS\.([a-zA-Z0-9_]+)/g;
for (const match of source.matchAll(globalRefRegex)) {
  const value = globalKeys[match[1]];
  if (value) {
    resolvedKeys.add(value);
  }
}

const companyScopedLiteralRegex = /companyScopedKey\(\s*["'`]([^"'`]+)["'`]\s*,/g;
for (const match of source.matchAll(companyScopedLiteralRegex)) {
  resolvedKeys.add(`${match[1]}_`);
}

const companyScopedGlobalRegex = /companyScopedKey\(\s*GLOBAL_CACHE_KEYS\.([a-zA-Z0-9_]+)\s*,/g;
for (const match of source.matchAll(companyScopedGlobalRegex)) {
  const value = globalKeys[match[1]];
  if (value) {
    resolvedKeys.add(`${value}_`);
  }
}

const keysToCheck = Array.from(resolvedKeys)
  .filter((key) => !key.startsWith("hasap_"))
  .sort();

const invalidationPatterns = CACHE_CONFIG.invalidationPatterns || {};
const patternEntries = Object.entries(invalidationPatterns);

const unmatched = [];
for (const key of keysToCheck) {
  let covered = false;
  for (const [, patterns] of patternEntries) {
    if (!Array.isArray(patterns)) {
      continue;
    }
    if (patterns.some((pattern) => key === pattern || key.startsWith(pattern) || pattern.startsWith(key))) {
      covered = true;
      break;
    }
  }
  if (!covered) {
    unmatched.push(key);
  }
}

if (unmatched.length > 0) {
  console.error("Cache audit failed. Uncovered cache keys:");
  for (const key of unmatched) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.info(`Cache audit passed. Checked keys: ${keysToCheck.length}`);
