import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewsDir = path.join(root, 'src', 'views');

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, files);
        } else if (entry.name.endsWith('.vue')) {
            files.push(full);
        }
    }
    return files;
}

function extractPersistKey(content) {
    const dataMatch = content.match(/tableColumnsPersistKey:\s*['"]([^'"]+)['"]/);
    if (dataMatch) {
        return dataMatch[1];
    }
    const computedMatch = content.match(/tableColumnsPersistKey\(\)\s*\{[\s\S]*?return\s+['"]([^'"]+)['"]/);
    if (computedMatch) {
        return computedMatch[1];
    }
    const tableKeyMatch = content.match(/<DraggableTable[^>]*table-key=["']([^"']+)["']/);
    if (tableKeyMatch) {
        return tableKeyMatch[1];
    }
    return '';
}

function extractExtraSlot(inner) {
    const withoutButton = inner.replace(/^[\s\S]*?<TableFilterButton[^>]*>\s*/i, '');
    let body = withoutButton.replace(/\s*<\/TableFilterButton>[\s\S]*$/i, '');
    body = body.replace(/<TableColumnDateModeSection[\s\S]*?\/>/g, '');
    body = body.replace(/<ul>[\s\S]*?<\/ul>/g, '');
    body = body.trim();
    return body;
}

function cleanupImports(content) {
    let next = content;
    const stillUsesDraggable = /<draggable[\s>]/.test(next) || /draggable:\s*VueDraggableNext/.test(next);
    const stillUsesFilterButton = /<TableFilterButton[\s>]/.test(next);
    const stillUsesDateSection = /<TableColumnDateModeSection[\s>]/.test(next);

    if (!stillUsesFilterButton) {
        next = next.replace(/import TableFilterButton from ['"][^'"]+['"];\n?/g, '');
    }
    if (!stillUsesDraggable) {
        next = next.replace(/import \{ VueDraggableNext \} from ['"]vue-draggable-next['"];\n?/g, '');
        next = next.replace(/\n?\s*draggable:\s*VueDraggableNext,?\n?/g, '\n');
    }
    if (!stillUsesDateSection) {
        next = next.replace(/import TableColumnDateModeSection from ['"][^'"]+['"];\n?/g, '');
        next = next.replace(/\n?\s*TableColumnDateModeSection,?\n?/g, '\n');
    }

    if (!next.includes('TableColumnsGearMenuWithDateModes')) {
        next = next.replace(/import TableColumnsGearMenuWithDateModes from ['"][^'"]+['"];\n?/g, '');
        next = next.replace(/\n?\s*TableColumnsGearMenuWithDateModes,?\n?/g, '\n');
    }

    if (!next.includes('TableColumnsGearMenu')) {
        next = next.replace(/import TableColumnsGearMenu from ['"][^'"]+['"];\n?/g, '');
        next = next.replace(/\n?\s*TableColumnsGearMenu,?\n?/g, '\n');
    }

    return next;
}

function ensureImport(content, importLine, componentName) {
    if (content.includes(componentName)) {
        if (!content.includes(importLine)) {
            return content.replace(/(<script>\n)/, `$1${importLine}\n`);
        }
        return content;
    }
    return content;
}

function ensureComponent(content, componentName) {
    if (!content.includes(componentName)) {
        return content;
    }
    if (new RegExp(`\\b${componentName}\\b`).test(content) && content.includes('components:')) {
        if (!new RegExp(`components:\\s*\\{[\\s\\S]*\\b${componentName}\\b`).test(content)) {
            return content.replace(/components:\s*\{/, `components: {\n        ${componentName},`);
        }
    }
    return content;
}

const skipFiles = new Set([
    path.join(viewsDir, 'components', 'app', 'forms', 'TableColumnsGearMenu.vue'),
    path.join(viewsDir, 'components', 'app', 'forms', 'TableColumnsGearMenuWithDateModes.vue'),
    path.join(viewsDir, 'components', 'app', 'forms', 'TableFilterButton.vue'),
    path.join(viewsDir, 'components', 'app', 'forms', 'TableControlsBar.vue'),
    path.join(viewsDir, 'components', 'app', 'forms', 'DraggableTable.vue'),
    path.join(viewsDir, 'components', 'app', 'cards', 'CardListViewShell.vue'),
    path.join(viewsDir, 'pages', 'projects', 'ProjectBalanceTab.vue'),
]);

let changed = 0;

for (const file of walk(viewsDir)) {
    if (skipFiles.has(file)) {
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('<template #gear') || !content.includes('TableFilterButton')) {
        continue;
    }

    const gearRegex = /<template\s+#gear[\s\S]*?<\/template>\s*(?=\n\s*<\/TableControlsBar>)/;
    const match = content.match(gearRegex);
    if (!match) {
        continue;
    }

    const inner = match[0];
    const hasDateMode = inner.includes('TableColumnDateModeSection');
    const persistKey = extractPersistKey(content);
    const extraSlot = extractExtraSlot(inner);

    let replacement;
    if (hasDateMode) {
        const persistAttr = persistKey
            ? `\n                  table-columns-persist-key="${persistKey}"`
            : '';
        replacement = `<template #gear="gearProps">
                <TableColumnsGearMenuWithDateModes
                  v-bind="gearProps"${persistAttr}
                >${extraSlot ? `\n                  ${extraSlot}\n                ` : ''}</TableColumnsGearMenuWithDateModes>
              </template>`;
        content = content.replace(gearRegex, replacement);
        content = ensureImport(
            content,
            "import TableColumnsGearMenuWithDateModes from '@/views/components/app/forms/TableColumnsGearMenuWithDateModes.vue';",
            'TableColumnsGearMenuWithDateModes'
        );
        content = ensureComponent(content, 'TableColumnsGearMenuWithDateModes');
    } else {
        content = content.replace(gearRegex, '');
    }

    content = cleanupImports(content);
    fs.writeFileSync(file, content);
    changed += 1;
    console.log(path.relative(root, file));
}

console.log(`Updated ${changed} files`);
