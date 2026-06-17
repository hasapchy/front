import fs from 'fs';
import path from 'path';

const pagesRoot = path.resolve('src/views/pages');

const files = [
  { file: 'warehouses/WarehousesWriteoffPage.vue', persistKey: null, dynamicPersistKey: 'writeoffTableStorageKey' },
  { file: 'clients/ClientsPage.vue', persistKey: 'common.clients' },
  { file: 'projects/ProjectsPage.vue', persistKey: 'admin.projects' },
  { file: 'projects/ProjectContractsPage.vue', persistKey: 'project.contracts.all' },
  { file: 'sales/SalesPage.vue', persistKey: 'admin.sales' },
  { file: 'projects/ProjectBalanceTab.vue', persistKey: 'project.balance' },
  { file: 'warehouses/WarehousesReceiptPage.vue', persistKey: 'admin.warehouse_receipts' },
  { file: 'leaves/LeavesPage.vue', persistKey: 'admin.leaves' },
  { file: 'leads/LeadsPage.vue', persistKey: 'admin.leads', gearSlot: true },
  { file: 'currencies/CurrenciesPage.vue', persistKey: 'settings.currencies' },
  { file: 'mutual_settlements/MutualSettlementsPage.vue', persistKey: 'mutual_settlements.clients' },
  { file: 'cash_registers/CashRegistersPage.vue', persistKey: 'admin.cash_registers' },
  { file: 'orders/OrderStatusCategoriesPage.vue', persistKey: 'admin.order_status_categories' },
  { file: 'invoices/InvoicesPage.vue', persistKey: 'admin.invoices' },
  { file: 'simple/SimpleOrdersPage.vue', persistKey: 'simpleOrders' },
  { file: 'orders/OrderStatusesPage.vue', persistKey: 'admin.order_statuses' },
  { file: 'transfers/TransfersPage.vue', persistKey: 'admin.transfers' },
  { file: 'journal_entries/JournalEntriesPage.vue', persistKey: 'finance.journal_entries' },
  { file: 'units/UnitsPage.vue', persistKey: 'settings.units_catalog' },
  { file: 'message-templates/MessageTemplatesPage.vue', persistKey: 'admin.message_templates' },
  { file: 'transactions/TransactionCategoriesPage.vue', persistKey: 'admin.transaction_categories' },
  { file: 'tasks/TasksPage.vue', persistKey: 'admin.tasks' },
  { file: 'transactions/TransactionTemplatesPage.vue', persistKey: 'transactions.templates' },
  { file: 'products/ProductsPage.vue', persistKey: 'admin.products' },
  { file: 'companies/CompaniesPage.vue', persistKey: 'admin.companies' },
  { file: 'categories/CategoriesPage.vue', persistKey: 'admin.categories' },
  { file: 'roles/RolesPage.vue', persistKey: 'admin.roles' },
  { file: 'users/UsersPage.vue', persistKey: 'admin.users' },
];

const dateBlockRegex = /<div\s+v-if="[^"]*tableDateDisplayModeHint[^"]*|(?:dateColumnsForSettings|columns\.map|gearSlot\.columns)[^"]*"\s+class="mb-2 border-b[\s\S]*?<\/div>\s*<\/div>\s*(?=<ul>)/;

const dateBlockRegex2 = /<div\s+v-if="(?:dateColumnsForSettings\(columns\)\.length|columns\.map\(\(column, index\) => \(\{ column, index \}\)\)\.filter\(\(\{ column \}\) => column\.name !== 'select' && \(column\.type === 'date' \|\| column\.type === 'datetime'\)\)\.length|gearSlot\.columns && gearSlot\.columns\.map\(\(column, index\) => \(\{ column, index \}\)\)\.filter\(\(\{ column \}\) => column\.name !== 'select' && \(column\.type === 'date' \|\| column\.type === 'datetime'\)\)\.length)"\s+class="mb-2 border-b border-gray-200 pb-2 dark:border-\[var\(--border-subtle\)\]">[\s\S]*?<\/div>\s*<\/div>\s*(?=<ul>)/;

const methodsRegex = /\n\s{4,8}isDateColumn\(column\) \{[\s\S]*?\n\s{4,8}dateColumnsForSettings\(columns\) \{[\s\S]*?\n\s{4,8}\},?\n/;

function buildComponentSnippet(indent, columnsExpr) {
  const i = indent;
  return `${i}<TableColumnDateModeSection\n${i}  :items="dateColumnsForSettings(${columnsExpr})"\n${i}  :resolve-mode="resolveColumnDateMode"\n${i}  @set-mode="(item, mode) => setColumnDateDisplayMode(${columnsExpr}, item.index, mode)"\n${i}/>\n`;
}

function migrateTemplate(content, config) {
  const columnsExpr = config.gearSlot ? 'gearSlot.columns' : 'columns';
  const match = content.match(dateBlockRegex2);
  if (!match) {
    throw new Error('Template block not found');
  }
  const indent = match[0].match(/^(\s*)<div/)?.[1] ?? '                    ';
  const replacement = buildComponentSnippet(indent, columnsExpr);
  return content.replace(dateBlockRegex2, replacement);
}

function addImport(content, importLine) {
  if (content.includes(importLine)) {
    return content;
  }
  const tableFilterImport = content.match(/import TableFilterButton[^\n]+\n/);
  if (tableFilterImport) {
    return content.replace(tableFilterImport[0], tableFilterImport[0] + importLine + '\n');
  }
  const draggableImport = content.match(/import DraggableTable[^\n]+\n/);
  if (draggableImport) {
    return content.replace(draggableImport[0], draggableImport[0] + importLine + '\n');
  }
  throw new Error('Could not find anchor for import');
}

function addComponent(content) {
  if (content.includes('TableColumnDateModeSection')) {
    return content;
  }
  return content
    .replace(/(TableFilterButton,?\s*)/, '$1TableColumnDateModeSection, ')
    .replace(/(components:\s*\{[^}]*)(FieldHint,?\s*)/, '$1TableColumnDateModeSection, ')
    .replace(/FieldHint,\s*TableColumnDateModeSection/g, 'TableColumnDateModeSection')
    .replace(/TableColumnDateModeSection,\s*TableColumnDateModeSection/g, 'TableColumnDateModeSection');
}

function removeFieldHint(content) {
  return content
    .replace(/import FieldHint from ['"]@\/views\/components\/app\/forms\/FieldHint\.vue['"];?\n/g, '')
    .replace(/,?\s*FieldHint,?/g, (m, offset, str) => {
      const before = str.slice(Math.max(0, offset - 30), offset);
      const after = str.slice(offset + m.length, offset + m.length + 30);
      if (!before.includes('components') && !before.includes('FieldHint')) {
        return m;
      }
      return '';
    })
    .replace(/,\s*,/g, ',')
    .replace(/\{\s*,/g, '{')
    .replace(/,\s*\}/g, ' }');
}

function addMixin(content) {
  if (content.includes('tableColumnDateModeMixin')) {
    return content;
  }
  const mixinImport = "import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';\n";
  const lastMixinImport = [...content.matchAll(/import \w+Mixin[^\n]+\n/g)].pop();
  if (lastMixinImport) {
    content = content.replace(lastMixinImport[0], lastMixinImport[0] + mixinImport);
  } else {
    content = addImport(content, mixinImport.trim());
  }
  return content.replace(/(mixins:\s*\[[^\]]*)(\])/, '$1, tableColumnDateModeMixin$2');
}

function addPersistKey(content, config) {
  if (config.dynamicPersistKey) {
    if (content.includes('tableColumnsPersistKey()')) {
      return content;
    }
    const computedBlock = content.match(/computed:\s*\{/);
    if (!computedBlock) {
      throw new Error('No computed block for dynamic persist key');
    }
    return content.replace(/computed:\s*\{/, `computed: {\n        tableColumnsPersistKey() {\n            return this.${config.dynamicPersistKey};\n        },`);
  }
  if (content.includes('tableColumnsPersistKey')) {
    return content;
  }
  return content.replace(/data\(\)\s*\{\s*return\s*\{/, `data() {\n        return {\n            tableColumnsPersistKey: '${config.persistKey}',`);
}

function removeNormalizeImportIfUnused(content) {
  const usesNormalize = /normalizeDateDisplayMode/.test(content.replace(/import[^;]*normalizeDateDisplayMode[^;]*;?\n/g, ''));
  if (!usesNormalize) {
    content = content.replace(/import \{([^}]*),\s*normalizeDateDisplayMode\s*\} from '@\/utils\/dateUtils';\n/g, "import {$1} from '@/utils/dateUtils';\n");
    content = content.replace(/import \{normalizeDateDisplayMode,\s*([^}]*)\} from '@\/utils\/dateUtils';\n/g, "import {$1} from '@/utils/dateUtils';\n");
    content = content.replace(/import \{ normalizeDateDisplayMode \} from '@\/utils\/dateUtils';\n/g, '');
    content = content.replace(/import \{([^}]*),\s*normalizeDateDisplayMode\s*\} from '@\/utils\/dateUtils';\n/g, "import {$1} from '@/utils/dateUtils';\n");
    content = content.replace(/,\s*normalizeDateDisplayMode/g, '');
    content = content.replace(/normalizeDateDisplayMode,\s*/g, '');
    content = content.replace(/import \{\s*\} from '@\/utils\/dateUtils';\n/g, '');
  }
  return content;
}

function removeMethods(content) {
  return content.replace(methodsRegex, '\n');
}

for (const config of files) {
  const filePath = path.join(pagesRoot, config.file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = migrateTemplate(content, config);
  content = addImport(content, "import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';");
  content = addComponent(content);
  content = removeFieldHint(content);
  content = addMixin(content);
  content = addPersistKey(content, config);
  content = removeMethods(content);
  content = removeNormalizeImportIfUnused(content);

  if (content === original) {
    console.log('UNCHANGED:', config.file);
  } else {
    fs.writeFileSync(filePath, content);
    console.log('MIGRATED:', config.file);
  }
}
