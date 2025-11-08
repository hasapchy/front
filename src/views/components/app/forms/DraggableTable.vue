<template>

  <div class="flex flex-row-reverse">
    <TableFilterButton v-if="columns.length" :onReset="resetColumns">
      <ul>
        <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
          <li v-for="(element, index) in columns" :key="element.name" @click="toggleVisible(index)"
            class="flex items-center hover:bg-gray-100 p-2 rounded">
            <div class="space-x-2 flex flex-row justify-between w-full select-none">
              <div>
                <i class="text-sm mr-2 text-[#337AB7]"
                  :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                {{ element.label }}
              </div>
              <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
            </div>
          </li>
        </draggable>
      </ul>
    </TableFilterButton>
  </div>


  <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
    <thead class="bg-gray-100 rounded-t-sm">
      <draggable v-if="columns.length" tag="tr" class="dragArea list-group w-full" :list="columns" @change="log">
        <th v-for="(element, index) in columns" :key="element.name"
          :class="{ hidden: !element.visible, relative: true }"
          class="text-left border border-gray-300 py-2 px-4 font-medium cursor-pointer select-none"
          :style="getColumnStyle(element)" @dblclick.prevent="sortBy(element.name)"
          :title="$t('doubleClickToSort') + ' ' + element.label">
          <template v-if="element.name === 'select'">
            <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" style="cursor:pointer;" />
          </template>
          <template v-else>
            <span>{{ element.label }}</span>
            <span v-if="sortKey === element.name" class="ml-1">
              <i v-if="sortOrder === 1" class="fas fa-sort-up"></i>
              <i v-else class="fas fa-sort-down"></i>
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
        <td class="py-2 px-4 border-x border-gray-300" :colspan="columns.length">
          {{ $t('noData') }}
        </td>
      </tr>
      <tr v-for="(item, idx) in sortedData" :key="idx" class="cursor-pointer hover:bg-gray-100 transition-all"
        :class="{ 
          'border-b border-gray-300': idx !== sortedData.length - 1,
          'opacity-50': item.isDeleted || item.is_deleted 
        }" @dblclick="(e) => itemClick(item, e)">
        <td v-for="(column, cIndex) in columns" :key="`${cIndex}_${idx}`" 
          class="py-2 px-4 border-x border-gray-300"
          :class="{ 
            hidden: !column.visible,
            'note-cell': column.name === 'note'
          }" 
          :style="getColumnStyle(column)"
          :title="column.name === 'note' ? getNoteTitle(item, column) : null">
          <template v-if="column.name === 'select'">
            <input type="checkbox" :checked="selectedIds.includes(item.id)" @change.stop="toggleSelectRow(item.id)"
              style="cursor:pointer;" />
          </template>
          <template v-if="column.component">
            <component :is="column.component" v-bind="column.props?.(item)" />
          </template>
          <template v-else-if="column.image && itemMapper(item, column.name) !== null">
            <img :src="itemMapper(item, column.name)" width="50" class="rounded" />
          </template>
          <template v-else-if="column.html">
            <span v-html="itemMapper(item, column.name)" @click="(e) => handleHtmlClick(e, item, column)"
              :class="{ 'line-through': item.isDeleted || item.is_deleted }"></span>
          </template>
          <template v-else>
            <span :class="{ 'line-through': item.isDeleted || item.is_deleted }">{{ itemMapper(item, column.name) }}</span>
          </template>
        </td>
      </tr>
    </tbody>
  </table>
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
      sortOrder: 1,
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
        
        // Сумма транзакций
        if (this.sortKey === 'cashAmount') {
          const na = this.normalizeNumber(a.cashAmount);
          const nb = this.normalizeNumber(b.cashAmount);
          if (na !== null && nb !== null) {
            return (na - nb) * this.sortOrder;
          }
        }
        
        // Оригинальная сумма транзакций
        if (this.sortKey === 'origAmount') {
          const na = this.normalizeNumber(a.origAmount);
          const nb = this.normalizeNumber(b.origAmount);
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
  },
  methods: {
    getStorageKey() {
      const companyId = this.$store.state.currentCompany?.id || 'default';
      return `tableColumns_${this.tableKey}_${companyId}`;
    },
    loadColumns() {
      const saved = localStorage.getItem(this.getStorageKey());
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
      localStorage.setItem(this.getStorageKey(), JSON.stringify(serializableColumns));
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
      const companyId = this.$store.state.currentCompany?.id || 'default';
      return `tableSort_${this.tableKey}_${companyId}`;
    },
    saveSort() {
      localStorage.setItem(
        this.getSortStorageKey(),
        JSON.stringify({ key: this.sortKey, order: this.sortOrder })
      );
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = -this.sortOrder;
      } else {
        this.sortKey = key;
        this.sortOrder = 1;
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
        const saved = localStorage.getItem(this.getSortStorageKey());
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

    const saved = localStorage.getItem(this.getSortStorageKey());
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
.note-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-cell > span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
</style>