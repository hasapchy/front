<template>
  <div class="w-full">
    <slot name="tableControlsBar" :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible"
      :log="log">
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <slot name="tableSettingsAdditional"></slot>
        <div class="flex items-center gap-2">
          <slot name="tableSettingsRight"></slot>
        </div>
        <div class="ml-auto">
          <TableFilterButton v-if="columns.length" :onReset="resetColumns">
            <ul>
              <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
                <li v-for="(element, index) in columns" :key="element.name" @click="toggleVisible(index)"
                  class="flex items-center hover:bg-gray-100 p-2 rounded">
                  <div class="space-x-2 flex flex-row justify-between w-full select-none">
                    <div>
                      <i class="text-sm mr-2 text-[#337AB7]"
                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                      {{ $te(element.label) ? $t(element.label) : element.label }}
                    </div>
                    <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
                  </div>
                </li>
              </draggable>
            </ul>
          </TableFilterButton>
        </div>
      </div>
    </slot>

    <!-- Desktop/Tablet Table View (hidden on mobile) -->
    <div class="desktop-table overflow-x-auto">
      <div class="overflow-x-auto w-full">
        <table class="draggable-table min-w-full bg-white shadow-md rounded mb-6" style="font-size: 12px;">
          <thead class="bg-gray-100 rounded-t-sm">
            <draggable v-if="columns.length" tag="tr" class="dragArea list-group w-full" :list="columns" @change="log">
              <th v-for="(element, index) in columns" :key="element.name"
                :class="{ hidden: !element.visible, relative: true }"
                class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium cursor-pointer select-none whitespace-nowrap"
                :style="getColumnStyle(element)" @dblclick.prevent="sortBy(element.name)"
                :title="$t('doubleClickToSort') + ' ' + ($te(element.label) ? $t(element.label) : element.label)">
                <template v-if="element.name === 'select'">
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" style="cursor:pointer;" />
                </template>
                <template v-else>
                  <span>{{ $te(element.label) ? $t(element.label) : element.label }}</span>
                  <span v-if="sortKey === element.name" class="ml-1">
                    <i v-if="sortOrder === 1" class="fas fa-sort-down"></i>
                    <i v-else class="fas fa-sort-up"></i>
                  </span>
                  <span v-else class="ml-1 text-gray-300">
                    <i class="fas fa-sort"></i>
                  </span>
                  <span v-if="element.visible" class="resize-handle absolute top-0 right-0 h-full w-1 cursor-col-resize"
                    @mousedown.prevent="startResize($event, index)"></span>
                </template>
              </th>
            </draggable>
          </thead>
          <tbody>
            <tr v-if="sortedData.length === 0" class="text-center">
              <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300" :colspan="columns.length">
                {{ $t('noData') }}
              </td>
            </tr>
            <tr v-for="(item, idx) in sortedData" :key="idx" class="cursor-pointer hover:bg-gray-100 transition-all"
              :class="{
                'border-b border-gray-300': idx !== sortedData.length - 1,
                'opacity-50': item.isDeleted || item.is_deleted
              }" @dblclick="(e) => itemClick(item, e)">
              <td v-for="(column, cIndex) in columns" :key="`${cIndex}_${idx}`"
                class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300" :class="{
                  hidden: !column.visible,
                  'note-cell': column.name === 'note'
                }" :style="getColumnStyle(column)" :title="column.name === 'note' ? getNoteTitle(item, column) : null">
                <template v-if="column.name === 'select'">
                  <input type="checkbox" :checked="selectedIds.includes(item.id)"
                    @change.stop="toggleSelectRow(item.id)" class="cursor-pointer" />
                </template>
                <template v-if="column.component">
                  <component :is="column.component" v-bind="column.props?.(item)" />
                </template>
                <template v-else-if="column.image && itemMapper(item, column.name) !== null">
                  <img :src="itemMapper(item, column.name)" width="50" height="50" class="rounded object-cover" />
                </template>
                <template v-else-if="column.html">
                  <span v-html="itemMapper(item, column.name)" @click="(e) => handleHtmlClick(e, item, column)"
                    :class="{ 'line-through': item.isDeleted || item.is_deleted }"></span>
                </template>
                <template v-else>
                  <span :class="{ 'line-through': item.isDeleted || item.is_deleted }">{{ itemMapper(item, column.name)
                    }}</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Card View (visible on small screens) -->
    <div class="md:hidden space-y-4">
      <div v-if="sortedData.length === 0" class="bg-white shadow-md rounded-lg p-4 text-center text-sm text-gray-500">
        {{ $t('noData') }}
      </div>
      <div v-for="(item, idx) in sortedData" :key="idx" @click="(e) => itemClick(item, e)" :class="{
        'opacity-50': item.isDeleted || item.is_deleted
      }" class="bg-white shadow-md rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow">
        <div class="space-y-3">
          <div v-for="(column, cIndex) in visibleColumns" :key="`${cIndex}_${idx}`"
            class="flex flex-col border-b border-gray-100 pb-2 last:border-0 last:pb-0">
            <div class="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              {{ $te(column.label) ? $t(column.label) : column.label }}
            </div>
            <div class="text-sm text-gray-900 break-words"
              :class="{ 'line-through': item.isDeleted || item.is_deleted }">
              <template v-if="column.name === 'select'">
                <input type="checkbox" :checked="selectedIds.includes(item.id)" @change.stop="toggleSelectRow(item.id)"
                  class="cursor-pointer" />
              </template>
              <template v-else-if="column.component">
                <component :is="column.component" v-bind="column.props?.(item)" />
              </template>
              <template v-else-if="column.image && itemMapper(item, column.name) !== null">
                <img :src="itemMapper(item, column.name)" class="rounded object-cover max-w-full h-auto" />
              </template>
              <template v-else-if="column.html">
                <span v-html="itemMapper(item, column.name)" @click="(e) => handleHtmlClick(e, item, column)"></span>
              </template>
              <template v-else>
                {{ itemMapper(item, column.name) }}
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import dayjs from 'dayjs';
export default {
  name: 'DragaggableTable',
  emits: ['selectionChange'],
  components: { draggable: VueDraggableNext, TableFilterButton, StatusSelectCell, PrimaryButton },
  props: {
    tableKey: { type: String, required: true },
    columnsConfig: { type: Array, required: true },
    tableData: { type: Array, required: true },
    itemMapper: { type: Function, required: true },
    onItemClick: { type: Function },
    onHtmlCellClick: { type: Function },
  },
  data() {
    return {
      columns: [],
      resizing: false,
      sortKey: null,
      sortOrder: -1, // Начальное значение: от большего к меньшему
      resizingColumn: null,
      startX: 0,
      startWidth: 0,
      selectedIds: [],
    };
  },
  computed: {
    sortedData() {
      if (!this.sortKey) {
        return this.tableData;
      }

      return [...this.tableData].sort((a, b) => {
        if (this.sortKey === 'dateUser') {
          return (
            (dayjs(a.date).valueOf() - dayjs(b.date).valueOf()) *
            this.sortOrder
          );
        }

        // Специальная обработка для числовых полей с HTML форматированием

        // Баланс клиентов и взаиморасчетов
        if (this.sortKey === 'balance') {
          // Используем balance_value если есть (взаиморасчеты), иначе balance (клиенты)
          const va = a.balance_value !== undefined ? a.balance_value : a.balance;
          const vb = b.balance_value !== undefined ? b.balance_value : b.balance;
          const na = this.normalizeNumber(va);
          const nb = this.normalizeNumber(vb);
          if (na !== null && nb !== null) {
            return (na - nb) * this.sortOrder;
          }
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
    visibleColumns() {
      return this.columns.filter(col => col.visible && col.name !== 'select');
    },
  },
  methods: {
    getStorageKey() {
      return `tableColumns_${this.tableKey}`;
    },
    getLegacyStorageKey() {
      const companyId = this.$store.state.currentCompany?.id || 'default';
      return `tableColumns_${this.tableKey}_${companyId}`;
    },
    getStorageItem(primaryKey, legacyKey) {
      const saved = localStorage.getItem(primaryKey);
      if (saved) {
        return saved;
      }
      const legacy = legacyKey ? localStorage.getItem(legacyKey) : null;
      if (!legacy) {
        return null;
      }
      localStorage.setItem(primaryKey, legacy);
      if (legacyKey) {
        localStorage.removeItem(legacyKey);
      }
      return legacy;
    },
    setStorageItem(primaryKey, legacyKey, value) {
      localStorage.setItem(primaryKey, value);
      if (legacyKey) {
        localStorage.removeItem(legacyKey);
      }
    },
    loadColumns() {
      const saved = this.getStorageItem(this.getStorageKey(), this.getLegacyStorageKey());
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          this.columns = savedColumns.map((savedCol) => {
            const original = this.columnsConfig.find(c => c.name === savedCol.name) || {};
            let size = savedCol.size ?? null;
            if (savedCol.name === 'note' && size !== null && size > 200) {
              size = 200;
            }
            return {
              ...savedCol,
              label: original.label || savedCol.label,
              component: original.component,
              props: original.props,
              size: size,
            };
          });
        } catch (error) {
          console.warn('Failed to load saved columns, using default configuration:', error);
          this.resetColumns();
        }
      } else {
        this.columns = this.columnsConfig.map((col, index) => ({
          ...col,
          sort_index: index,
          visible: col.visible !== undefined ? col.visible : true,
          size: col.size ?? null,
        }));
      }
    },
    resetColumns() {
      this.columns = this.columnsConfig.map((col, index) => {
        let size = col.size ?? null;
        if (col.name === 'note' && size !== null && size > 200) {
          size = 200;
        }
        return {
          ...col,
          sort_index: index,
          visible: col.visible !== undefined ? col.visible : true,
          size: size,
        };
      });
      this.saveColumns();
    },
    saveColumns() {
      const serializableColumns = this.columns.map(col => {
        const { component, props, ...serializableCol } = col;
        return serializableCol;
      });
      this.setStorageItem(
        this.getStorageKey(),
        this.getLegacyStorageKey(),
        JSON.stringify(serializableColumns)
      );
    },
    toggleVisible(index) {
      this.columns[index].visible = !this.columns[index].visible;
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
    getSortStorageKey() {
      return `tableSort_${this.tableKey}`;
    },
    getLegacySortStorageKey() {
      const companyId = this.$store.state.currentCompany?.id || 'default';
      return `tableSort_${this.tableKey}_${companyId}`;
    },
    saveSort() {
      this.setStorageItem(
        this.getSortStorageKey(),
        this.getLegacySortStorageKey(),
        JSON.stringify({ key: this.sortKey, order: this.sortOrder })
      );
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortKey = key;
        this.sortOrder = -1; // Начинаем с сортировки от большего к меньшему
      }
      this.saveSort();
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

      // Для колонок с примечаниями ограничиваем максимальную ширину 200px
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
      // Проверяем клик по элементу с data-атрибутами
      const target = e.target;
      if (target && target.hasAttribute('data-source-type') && target.hasAttribute('data-source-id')) {
        e.stopPropagation(); // Останавливаем всплытие чтобы не открывалась форма редактирования транзакции
        if (this.onHtmlCellClick) {
          this.onHtmlCellClick(item, column, {
            sourceType: target.getAttribute('data-source-type'),
            sourceId: target.getAttribute('data-source-id')
          });
        }
      }
    },
    normalizeNumber(value) {
      if (value === null || value === undefined) return null;
      // Если уже число
      if (typeof value === 'number') {
        if (Number.isNaN(value)) return null;
        return value;
      }
      // Строка с HTML/валютой/пробелами
      let str = String(value).replace(/<[^>]*>/g, ''); // убрать HTML
      str = str.replace(/\s+/g, ''); // убрать пробелы
      // заменить нечисловые валютные символы
      str = str.replace(/[^0-9+\-.,]/g, '');
      // если есть и запятая и точка, предполагаем точка — десятичный, запятые — тысячные
      if (str.includes('.') && str.includes(',')) {
        str = str.replace(/,/g, '');
      } else if (str.includes(',') && !str.includes('.')) {
        // запятая как десятичный разделитель
        str = str.replace(',', '.');
      }
      const num = parseFloat(str);
      return Number.isNaN(num) ? null : num;
    },
    getColumnStyle(column) {
      const style = {
        width: column.size ? column.size + 'px' : 'auto'
      };

      // Для колонок с примечаниями всегда устанавливаем ограничение максимальной ширины
      // Это предотвращает растягивание колонки из-за длинного текста
      if (column.name === 'note') {
        // Всегда ограничиваем максимальную ширину 200px
        // Пользователь может изменить размер через resize-handle, но не более 200px
        style.maxWidth = '200px';
      }

      return style;
    },
    getNoteTitle(item, column) {
      const noteValue = this.itemMapper(item, column.name);
      if (!noteValue) return null;

      // Если это HTML, извлекаем чистый текст
      if (column.html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = noteValue;
        return tempDiv.textContent || tempDiv.innerText || '';
      }

      return String(noteValue);
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
    '$store.state.currentCompany.id': {
      handler() {
        this.loadColumns();
        const saved = this.getStorageItem(
          this.getSortStorageKey(),
          this.getLegacySortStorageKey()
        );
        if (saved) {
          try {
            const { key, order } = JSON.parse(saved);
            this.sortKey = key;
            this.sortOrder = order;
          } catch (e) {
          }
        } else {
          this.sortKey = null;
          this.sortOrder = 1;
        }
      },
      immediate: false
    }
  },
  mounted() {
    this.loadColumns();

    const saved = this.getStorageItem(
      this.getSortStorageKey(),
      this.getLegacySortStorageKey()
    );
    if (saved) {
      try {
        const { key, order } = JSON.parse(saved);
        this.sortKey = key;
        this.sortOrder = order;
      } catch (e) {

      }
    }
  },
  beforeUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.stopResize);
  },
};
</script>

<style scoped>
.desktop-table {
  display: none;
}

@media (min-width: 768px) {
  .desktop-table {
    display: block;
  }
}

.note-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-cell>span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.draggable-table {
  width: 100%;
  min-width: max-content;
}
</style>