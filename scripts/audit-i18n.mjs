import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ru from '../src/lang/ru.js';
import en from '../src/lang/en.js';
import tm from '../src/lang/tm.js';
import { fillFromBase } from '../src/i18n/fillFromBase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportPath = join(__dirname, 'i18n-audit-report.txt');

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) {
      out[prefix] = obj;
    }
    return out;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, p, out);
    } else {
      out[p] = v;
    }
  }
  return out;
}

const fru = flatten(ru);
const fen = flatten(en);
const ftm = flatten(tm);
const fenEffective = flatten(fillFromBase(en, ru));
const ftmEffective = flatten(fillFromBase(tm, ru));

const keysRu = new Set(Object.keys(fru));
const keysEn = new Set(Object.keys(fen));
const keysTm = new Set(Object.keys(ftm));
const keysEnEff = new Set(Object.keys(fenEffective));
const keysTmEff = new Set(Object.keys(ftmEffective));

const missingInEn = [...keysRu].filter((k) => !keysEn.has(k)).sort();
const missingInTm = [...keysRu].filter((k) => !keysTm.has(k)).sort();
const extraInEn = [...keysEn].filter((k) => !keysRu.has(k)).sort();
const extraInTm = [...keysTm].filter((k) => !keysRu.has(k)).sort();
const missingEnInTm = [...keysEn].filter((k) => !keysTm.has(k)).sort();
const missingTmInEn = [...keysTm].filter((k) => !keysEn.has(k)).sort();
const missingInEnEffective = [...keysRu].filter((k) => !keysEnEff.has(k)).sort();
const missingInTmEffective = [...keysRu].filter((k) => !keysTmEff.has(k)).sort();

function section(title, lines) {
  return [title, ...lines, ''].join('\n');
}

const lines = [];
lines.push('=== Summary (flattened leaf keys, source files) ===');
lines.push(`RU: ${keysRu.size}`);
lines.push(`EN: ${keysEn.size}`);
lines.push(`TM: ${keysTm.size}`);
lines.push(`In RU, missing in EN (file): ${missingInEn.length}`);
lines.push(`In RU, missing in TM (file): ${missingInTm.length}`);
lines.push(`In EN, not in RU (extra): ${extraInEn.length}`);
lines.push(`In TM, not in RU (extra): ${extraInTm.length}`);
lines.push(`In EN, missing in TM (file): ${missingEnInTm.length}`);
lines.push(`In TM, missing in EN (file): ${missingTmInEn.length}`);
lines.push('');
lines.push('=== Runtime merge (fillFromBase in src/i18n/index.js) ===');
lines.push(`EN effective keys: ${keysEnEff.size} (gaps vs RU: ${missingInEnEffective.length})`);
lines.push(`TM effective keys: ${keysTmEff.size} (gaps vs RU: ${missingInTmEffective.length})`);
lines.push('');
lines.push('NOTE: RU/TM/EN locale files may define key "default" (e.g. *). It is a normal message key, not the module default export.');
lines.push('');
lines.push(section('=== In RU but missing in EN (file only) ===', missingInEn));
lines.push(section('=== In RU but missing in TM (file only) ===', missingInTm));
lines.push(section('=== In EN but not in RU ===', extraInEn));
lines.push(section('=== In TM but not in RU ===', extraInTm));
lines.push(section('=== In EN but missing in TM (file) ===', missingEnInTm));
lines.push(section('=== In TM but missing in EN (file) ===', missingTmInEn));
if (missingInEnEffective.length) {
  lines.push(section('=== In RU but missing after fillFromBase(en) — should be empty ===', missingInEnEffective));
}
if (missingInTmEffective.length) {
  lines.push(section('=== In RU but missing after fillFromBase(tm) — should be empty ===', missingInTmEffective));
}

const text = lines.join('\n');
writeFileSync(reportPath, text, 'utf8');

console.log('Wrote', reportPath);
console.log('RU:', keysRu.size, '| EN file:', keysEn.size, '| TM file:', keysTm.size);
console.log('EN effective:', keysEnEff.size, '| TM effective:', keysTmEff.size);
console.log('RU keys missing in EN file:', missingInEn.length, '(filled at runtime from RU)');
console.log('RU keys missing in TM file:', missingInTm.length, '(filled at runtime from RU)');
