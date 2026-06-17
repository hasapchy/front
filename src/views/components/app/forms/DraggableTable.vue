<template>
  <div class="w-full">
    <slot
      v-if="!hideControlsBar"
      name="tableControlsBar"
      :reset-columns="resetColumns"
      :resetColumns="resetColumns"
      :columns="columns"
      :toggle-visible="toggleVisible"
      :toggleVisible="toggleVisible"
      :log="log"
    >
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <slot name="tableSettingsAdditional" />
        <div class="flex items-center gap-2 ml-auto">
          <slot name="tableSettingsRight" />
        </div>
        <div>
          <TableFilterButton v-if="columns.length" :on-reset="resetColumns">
            <TableColumnDateModeSection
              :items="dateColumnsForSettings"
              :resolve-mode="resolveColumnDateMode"
              :show-column-label="true"
              :column-label-fn="columnLabel"
              @set-mode="(item, mode) => setColumnDateDisplayMode(item.index, mode)"
            />
            <ul>
              <draggable
                v-if="columns.length"
                class="dragArea list-group w-full"
                :list="columns"
                item-key="name"
                handle=".column-gear-drag-handle"
                @change="log"
              >
                <li v-for="(element, index) in columns" v-show="element.name !== 'select'" :key="element.name"
                  class="flex items-center rounded p-2 text-gray-800 hover:bg-gray-100 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
                  @click="toggleVisible(index)">
                  <div class="flex w-full flex-row justify-between space-x-2 select-none items-center">
                    <div class="min-w-0">
                      <i class="mr-2 text-sm text-[var(--color-info)] dark:text-[var(--label-accent)]"
                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']" />
                      {{ columnLabel(element.label) }}
                    </div>
                    <div class="flex items-center gap-1" @click.stop>
                      <i
                        class="column-gear-drag-handle fas fa-grip-vertical cursor-grab text-sm text-gray-300 dark:text-[#8d98a6]"
                      />
                    </div>
                  </div>
                </li>
              </draggable>
            </ul>
          </TableFilterButton>
        </div>
      </div>
    </slot>

    <div class="desktop-table">
      <div class="relative w-full">
        <div v-show="showXScrollArrows && affordanceVisible && canScrollLeft"
          class="xscroll-affordance xscroll-affordance--left" :style="xAffordanceLeftStyle">
          <div class="xscroll-affordance__chevron" @mouseenter="startAutoXScroll(-1)" @mouseleave="stopAutoXScroll">
            <i class="fas fa-chevron-left" />
          </div>
        </div>
        <div v-show="showXScrollArrows && affordanceVisible && canScrollRight"
          class="xscroll-affordance xscroll-affordance--right" :style="xAffordanceRightStyle">
          <div class="xscroll-affordance__chevron" @mouseenter="startAutoXScroll(1)" @mouseleave="stopAutoXScroll">
            <i class="fas fa-chevron-right" />
          </div>
        </div>

        <div ref="xScrollContainer" class="overflow-x-auto w-full" @scroll.passive="updateXScrollState">
          <table :class="[
            'draggable-table min-w-full bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-md rounded dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]',
            tableBottomSpacer ? 'mb-6' : '',
          ]">
            <thead class="bg-[var(--surface-muted)] rounded-t-sm">
              <draggable v-if="columns.length" tag="tr" class="dragArea list-group w-full" :list="columns" item-key="name"
                @change="log">
                <th v-for="(element, index) in columns" :key="element.name" :class="[
                  'border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium cursor-pointer select-none whitespace-nowrap dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]',
                  { hidden: !element.visible, relative: true },
                ]" :style="getColumnStyle(element)" :title="sortHeaderTitle(element)"
                  @dblclick.prevent="sortBy(element.name)">
                  <template v-if="element.name === 'select'">
                    <input type="checkbox" :checked="isAllSelected" style="cursor:pointer;" @change="toggleSelectAll">
                  </template>
                  <template v-else>
                    <span>{{ columnLabel(element.label) }}</span>
                    <span v-if="activeSortKey === element.name" class="ml-1">
                      <i v-if="sortOrder === 1" class="fas fa-sort-down" />
                      <i v-else class="fas fa-sort-up" />
                    </span>
                    <span v-else-if="!disableLocalSort" class="ml-1 text-gray-300 dark:text-[#8d98a6]">
                      <i class="fas fa-sort" />
                    </span>
                    <span v-if="element.visible"
                      class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize"
                      @mousedown.prevent="startResize($event, index)" />
                  </template>
                </th>
              </draggable>
            </thead>
            <tbody>
              <tr v-if="sortedData.length === 0" class="text-center">
                <td class="border border-gray-300 p-4 align-top dark:border-[var(--border-subtle)]"
                  :colspan="columns.length">
                  <CardViewEmptyState />
                </td>
              </tr>
              <tr v-for="(item, idx) in sortedData" :key="rowTrackKey(item, idx)"
                class="draggable-table-row cursor-pointer transition-colors" :class="[
                  {
                    'draggable-table-row--even': idx % 2 === 1,
                    'border-b border-gray-300 dark:border-[var(--border-subtle)]': idx !== sortedData.length - 1,
                    'draggable-table-row--deleted': item.isDeleted,
                  },
                  resolveRowClasses(item, idx),
                ]" @dblclick="(e) => itemClick(item, e)">
                <td v-for="(column, cIndex) in columns" :key="`${cIndex}_${idx}`"
                  class="text-center py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
                  :class="{
                    hidden: !column.visible,
                    'note-cell': column.name === 'note',
                  }" :style="getColumnStyle(column)" :title="column.name === 'note' ? getNoteTitle(item, column) : null">
                  <template v-if="column.name === 'select'">
                    <input type="checkbox" :checked="selectedIds.includes(item.id)" class="cursor-pointer"
                      @change.stop="toggleSelectRow(item.id)">
                  </template>
                  <template v-if="column.component">
                    <component :is="column.component" v-bind="column.props?.(item, column)" />
                  </template>
                  <template v-else-if="column.image && itemMapper(item, column.name) !== null">
                    <img :src="itemMapper(item, column.name)" width="50" height="50" class="rounded object-cover">
                  </template>
                  <template v-else-if="column.html">
                    <span :class="{ 'line-through': item.isDeleted }" @click="(e) => handleHtmlClick(e, item, column)"
                      v-html="itemMapper(item, column.name)" />
                  </template>
                  <template v-else>
                    <span :class="{ 'line-through': item.isDeleted }">{{ formatDateCellValue(item, column,
                      itemMapper(item, column.name))
                      }}</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import dayjs from 'dayjs';
import xScrollEdgeAffordanceMixin from '@/mixins/xScrollEdgeAffordanceMixin';
import { DRAFT_TABLE_ROW_CELL_CLASS, isDraftTableRow } from '@/utils/draftTableRowClass';
import { formatDateByDisplayMode, normalizeDateDisplayMode } from '@/utils/dateUtils';

export default {
  name: 'DraggableTable',
  components: {
    draggable: VueDraggableNext,
    TableFilterButton,
    TableColumnDateModeSection,
    CardViewEmptyState,
    StatusSelectCell,
    PrimaryButton,
  },
  mixins: [xScrollEdgeAffordanceMixin],
  props: {
    tableKey: { type: String, required: true },
    columnsConfig: { type: Array, required: true },
    tableData: { type: Array, required: true },
    itemMapper: { type: Function, required: true },
    onItemClick: { type: Function },
    onHtmlCellClick: { type: Function },
    disableLocalSort: { type: Boolean, default: false },
    externalSort: { type: Boolean, default: false },
    rowClassFn: { type: Function, default: null },
    highlightDraftRows: { type: Boolean, default: false },
    draftStatusValues: {
      type: Array,
      default: () => ['draft', 'in_progress'],
    },
    tableBottomSpacer: { type: Boolean, default: true },
    hideControlsBar: { type: Boolean, default: false },
  },
  emits: ['selectionChange', 'sortChange'],
  data() {
    return {
      columns: [],
      resizing: false,
      sortKey: null,
      sortOrder: -1,
      resizingColumn: null,
      startX: 0,
      startWidth: 0,
      selectedIds: [],
    };
  },
  computed: {
    activeSortKey() {
      if (this.disableLocalSort && !this.externalSort) {
        return null;
      }
      return this.sortKey;
    },
    sortedData() {
      if (this.disableLocalSort || this.externalSort || !this.sortKey) {
        return this.tableData;
      }

      return [...this.tableData].sort((a, b) => {
        if (this.sortKey === 'dateUser') {
          const da = a.date != null ? dayjs(a.date) : null;
          const db = b.date != null ? dayjs(b.date) : null;
          if (da?.isValid() && db?.isValid()) {
            return (da.valueOf() - db.valueOf()) * this.sortOrder;
          }
        }

        if (this.tableKey === 'mutual_settlements.clients' && this.sortKey === 'balance') {
          const na = Math.abs(Number(a.balance) || 0);
          const nb = Math.abs(Number(b.balance) || 0);
          return (na - nb) * this.sortOrder;
        }

        const sortCol = this.columns.find((c) => c.name === this.sortKey);
        const sortField = sortCol?.sortField;
        if (sortField) {
          const va = a[sortField];
          const vb = b[sortField];
          const na = this.normalizeNumber(va);
          const nb = this.normalizeNumber(vb);
          if (na !== null && nb !== null) {
            return (na - nb) * this.sortOrder;
          }
          return (va ?? '').toString().localeCompare((vb ?? '').toString()) * this.sortOrder;
        }

        const va = this.itemMapper(a, this.sortKey);
        const vb = this.itemMapper(b, this.sortKey);
        const na = this.normalizeNumber(va);
        const nb = this.normalizeNumber(vb);
        if (na !== null && nb !== null) {
          return (na - nb) * this.sortOrder;
        }

        return (va ?? '').toString().localeCompare((vb ?? '').toString()) * this.sortOrder;
      });
    },
    visibleIds() {
      return this.sortedData.map(item => item.id);
    },
    isAllSelected() {
      return this.visibleIds.length > 0 && this.visibleIds.every(id => this.selectedIds.includes(id));
    },
    tableColumnsStorageKey() {
      return this.$storageUi.tableColumnsStorageKey(
        this.tableKey,
        this.$store.state.currentCompany?.id
      );
    },
    tableSortStorageKey() {
      return this.$storageUi.tableSortStorageKey(
        this.tableKey,
        this.$store.state.currentCompany?.id
      );
    },
    dateColumnsForSettings() {
      return this.columns
        .map((column, index) => ({ column, index }))
        .filter(({ column }) => column.name !== 'select' && this.isDateColumn(column));
    },
  },
  watch: {
    columnsConfig: {
      handler() {
        this.loadColumns();
      },
      deep: true
    },
    '$i18n.locale': {
      handler() {
        this.loadColumns();
      },
      immediate: false
    },
    tableData: {
      handler() {
        this.$nextTick(() => this.scheduleUpdateAffordancePosition());
      },
      deep: false,
    },
    '$store.state.currentCompany.id': {
      handler() {
        this.loadColumns();
        this.applyStoredSortState();
      },
      immediate: false
    },
    tableKey() {
      this.loadColumns();
      this.applyStoredSortState();
    },
  },
  mounted() {
    this.loadColumns();
    this.applyStoredSortState();
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.stopResize);
  },
  methods: {
    resolveRowClasses(item, idx) {
      const parts = [];

      if (this.highlightDraftRows && isDraftTableRow(item, this.draftStatusValues)) {
        parts.push(DRAFT_TABLE_ROW_CELL_CLASS);
      }

      if (this.rowClassFn) {
        const custom = this.rowClassFn(item, idx);
        if (custom) {
          parts.push(custom);
        }
      }

      return parts.length ? parts.join(' ') : null;
    },
    clampNoteColumnWidth(columnName, size) {
      if (columnName === 'note' && size != null && size > 200) {
        return 200;
      }
      return size;
    },
    applyStoredSortState() {
      if (this.disableLocalSort && !this.externalSort) {
        this.sortKey = null;
        this.sortOrder = -1;
        return;
      }
      const saved = localStorage.getItem(this.tableSortStorageKey);
      if (!saved) {
        this.sortKey = null;
        this.sortOrder = -1;
      } else {
        try {
          const { key, order } = JSON.parse(saved);
          this.sortKey = key;
          this.sortOrder = order;
        } catch {
          this.sortKey = null;
          this.sortOrder = -1;
        }
      }
      if (this.externalSort) {
        this.$emit('sortChange', { key: this.sortKey, order: this.sortOrder });
      }
    },
    loadColumns() {
      const defaults = this.columnsFromConfig();
      const defaultByName = new Map(defaults.map((col) => [col.name, col]));
      const savedRaw = localStorage.getItem(this.tableColumnsStorageKey);

      if (!savedRaw) {
        this.columns = defaults;
        return;
      }

      let savedColumns;
      try {
        savedColumns = JSON.parse(savedRaw);
      } catch {
        this.resetColumns();
        return;
      }

      const merged = [];
      const present = new Set();

      for (const savedCol of savedColumns) {
        const defaultCol = defaultByName.get(savedCol.name);
        if (!defaultCol) {
          continue;
        }
        merged.push(this.applySavedColumnPreferences(defaultCol, savedCol));
        present.add(savedCol.name);
      }

      for (const defaultCol of defaults) {
        if (!present.has(defaultCol.name)) {
          merged.push({ ...defaultCol, sort_index: merged.length });
        }
      }

      this.columns = merged.map((col, index) => ({ ...col, sort_index: index }));

      const configNames = new Set(this.columnsConfig.map((col) => col.name));
      const savedNames = new Set(savedColumns.map((col) => col.name));
      const storageOutdated =
        merged.length !== savedColumns.length ||
        [...configNames].some((name) => !savedNames.has(name)) ||
        [...savedNames].some((name) => !configNames.has(name));

      if (storageOutdated) {
        this.saveColumns();
      }
    },
    applySavedColumnPreferences(defaultCol, savedCol) {
      return {
        ...defaultCol,
        visible: savedCol.visible !== undefined ? savedCol.visible : defaultCol.visible,
        dateDisplayMode: normalizeDateDisplayMode(
          defaultCol.type,
          savedCol.dateDisplayMode ?? defaultCol.dateDisplayMode
        ),
        size: this.clampNoteColumnWidth(
          defaultCol.name,
          savedCol.size ?? defaultCol.size ?? null
        ),
      };
    },
    columnsFromConfig() {
      return this.columnsConfig.map((col, index) => this.buildColumnFromConfig(col, index));
    },
    buildColumnFromConfig(col, index) {
      const size = this.clampNoteColumnWidth(col.name, col.size ?? null);
      return {
        ...col,
        sort_index: index,
        visible: col.visible !== undefined ? col.visible : true,
        dateDisplayMode: normalizeDateDisplayMode(col.type, col.dateDisplayMode),
        size,
      };
    },
    resetColumns() {
      this.columns = this.columnsFromConfig();
      this.saveColumns();
    },
    saveColumns() {
      const serializableColumns = this.columns.map((col) => {
        const copy = { ...col };
        delete copy.component;
        delete copy.props;
        return copy;
      });
      localStorage.setItem(
        this.tableColumnsStorageKey,
        JSON.stringify(serializableColumns)
      );
    },
    toggleVisible(index) {
      this.columns[index].visible = !this.columns[index].visible;
      this.saveColumns();
    },
    isDateColumn(column) {
      return column?.type === 'date' || column?.type === 'datetime';
    },
    resolveColumnDateMode(column) {
      return normalizeDateDisplayMode(column?.type, column?.dateDisplayMode);
    },
    setColumnDateDisplayMode(index, mode) {
      const column = this.columns[index];
      if (!this.isDateColumn(column)) {
        return;
      }
      this.columns[index].dateDisplayMode = normalizeDateDisplayMode(column.type, mode);
      this.saveColumns();
    },
    log() {
      this.columns = this.columns.map((col, index) => ({
        ...col,
        sort_index: index,
      }));
      this.saveColumns();
    },
    itemClick(i, e) {
      if (e?.target?.closest('.status-dropdown')) {
        return;
      }
      if (
        e?.target?.type === 'checkbox' ||
        e?.target?.closest('td')?.getAttribute('data-col-name') === 'select'
      ) {
        return;
      }
      this.onItemClick?.(i);
    },
    saveSort() {
      localStorage.setItem(
        this.tableSortStorageKey,
        JSON.stringify({ key: this.sortKey, order: this.sortOrder })
      );
    },
    rowTrackKey(item, idx) {
      const id = item?.id;
      if (id != null && id !== '') {
        return `id:${id}`;
      }
      const sid = item?.sourceId;
      if (sid != null && sid !== '') {
        return `sid:${sid}`;
      }
      return `i:${idx}`;
    },
    columnLabel(labelKey) {
      return this.$te(labelKey) ? this.$t(labelKey) : labelKey;
    },
    sortHeaderTitle(element) {
      const label = this.columnLabel(element.label);
      if (this.disableLocalSort && !this.externalSort) {
        return label;
      }
      return `${this.$t('doubleClickToSort')} ${label}`;
    },
    sortBy(key) {
      if (key === 'select' || (this.disableLocalSort && !this.externalSort)) {
        return;
      }
      if (this.sortKey === key) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortKey = key;
        this.sortOrder = -1;
      }
      this.saveSort();
      this.$emit('sortChange', { key: this.sortKey, order: this.sortOrder });
    },
    startResize(e, index) {
      this.resizing = true;
      this.resizingColumn = index;
      this.startX = e.clientX;
      this.startWidth = e.target.parentElement.offsetWidth;
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.stopResize);
    },
    onMouseMove(e) {
      if (!this.resizing) return;
      const dx = e.clientX - this.startX;
      const column = this.columns[this.resizingColumn];
      let newWidth = Math.max(50, this.startWidth + dx);
      if (column && column.name === 'note') {
        newWidth = Math.min(newWidth, 200);
      }
      this.columns[this.resizingColumn].size = newWidth;
    },
    stopResize() {
      if (!this.resizing) return;
      this.resizing = false;
      this.saveColumns();
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.stopResize);
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedIds = this.selectedIds.filter(id => !this.visibleIds.includes(id));
      } else {
        this.selectedIds = Array.from(new Set([...this.selectedIds, ...this.visibleIds]));
      }
      this.$emit('selectionChange', this.selectedIds.slice());
    },
    toggleSelectRow(id) {
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter(x => x !== id);
      } else {
        this.selectedIds = [...this.selectedIds, id];
      }
      this.$emit('selectionChange', this.selectedIds.slice());
    },
    handleHtmlClick(e, item, column) {
      const trigger = e.target?.closest?.('[data-source-type][data-source-id]');
      if (trigger) {
        e.stopPropagation();
        if (this.onHtmlCellClick) {
          this.onHtmlCellClick(item, column, {
            sourceType: trigger.getAttribute('data-source-type'),
            sourceId: trigger.getAttribute('data-source-id')
          });
        }
      }
    },
    normalizeNumber(value) {
      if (value === null || value === undefined) return null;
      if (Number.isNaN(Number(value))) return null;
      if (Number(value) === value) return value;
      let str = String(value).replace(/<[^>]*>/g, '');
      str = str.replace(/\s+/g, '');
      str = str.replace(/[^0-9+\-.,]/g, '');
      if (str.includes('.') && str.includes(',')) {
        str = str.replace(/,/g, '');
      } else if (str.includes(',') && !str.includes('.')) {
        str = str.replace(',', '.');
      }
      const num = parseFloat(str);
      return Number.isNaN(num) ? null : num;
    },
    getColumnStyle(column) {
      const style = {
        width: column.size ? column.size + 'px' : 'auto'
      };
      if (column.name === 'note') {
        style.maxWidth = '200px';
      }
      return style;
    },
    getNoteTitle(item, column) {
      const noteValue = this.formatDateCellValue(item, column, this.itemMapper(item, column.name));
      if (!noteValue) return null;
      if (column.html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = noteValue;
        return tempDiv.textContent || tempDiv.innerText;
      }

      return String(noteValue);
    },
    resolveRawDateValue(item, column) {
      if (!item || !column) {
        return null;
      }
      const candidate = item[column.name];
      if (candidate != null && candidate !== '') {
        return candidate;
      }
      const sortCandidate = column.sortField ? item[column.sortField] : null;
      if (sortCandidate != null && sortCandidate !== '') {
        return sortCandidate;
      }
      return null;
    },
    formatDateCellValue(item, column, mappedValue) {
      if (!this.isDateColumn(column)) {
        return mappedValue;
      }
      const sourceValue = this.resolveRawDateValue(item, column) ?? mappedValue;
      const formatted = formatDateByDisplayMode(sourceValue, column.type, column.dateDisplayMode);
      return formatted || mappedValue;
    },
  },
};
</script>