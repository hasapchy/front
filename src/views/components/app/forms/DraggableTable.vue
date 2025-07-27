<template>
  <!-- Настройка колонок -->
  <div class="flex flex-row-reverse">
    <TableFilterButton v-if="columns.length">
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
      <div class="flex flex-row-reverse">
        <button @click="resetColumns" class="text-[#337AB7] hover:underline mr-3 cursor-pointer">Сбросить</button>
      </div>
    </TableFilterButton>
  </div>

  <!-- Таблица -->
  <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
    <thead class="bg-gray-100 rounded-t-sm">
      <draggable v-if="columns.length" tag="tr" class="dragArea list-group w-full" :list="columns" @change="log">
        <th v-for="(element, index) in columns" :key="element.name"
          :class="{ hidden: !element.visible, relative: true }"
          class="text-left border border-gray-300 py-2 px-4 font-medium cursor-pointer select-none"
          :style="{ width: element.size ? element.size + 'px' : 'auto' }" @dblclick.prevent="sortBy(element.name)"
          :title="'Кликните 2 раза по ' + element.label + ' для сортировки'">
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
          Нет данных
        </td>
      </tr>
      <tr v-for="(item, idx) in sortedData" :key="idx" class="cursor-pointer hover:bg-gray-100 transition-all"
        :class="{ 'border-b border-gray-300': idx !== sortedData.length - 1 }" @click="(e) => itemClick(item, e)">
        <td v-for="(column, cIndex) in columns" :key="`${cIndex}_${idx}`" class="py-2 px-4 border-x border-gray-300"
          :class="{ hidden: !column.visible }" :style="{ width: column.size ? column.size + 'px' : 'auto' }">
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
            <span v-html="itemMapper(item, column.name)"></span>
          </template>
          <template v-else>
            <span>{{ itemMapper(item, column.name) }}</span>
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
import dayjs from 'dayjs';
export default {
  name: 'DragaggableTable',
  emits: ['selectionChange'],
  components: { draggable: VueDraggableNext, TableFilterButton, StatusSelectCell, },
  props: {
    tableKey: { type: String, required: true },
    columnsConfig: { type: Array, required: true },
    tableData: { type: Array, required: true },
    itemMapper: { type: Function, required: true },
    onItemClick: { type: Function },
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
        const va = this.itemMapper(a, this.sortKey);
        const vb = this.itemMapper(b, this.sortKey);
        if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) {
          return (parseFloat(va) - parseFloat(vb)) * this.sortOrder;
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
    loadColumns() {
      const saved = localStorage.getItem(`tableColumns_${this.tableKey}`);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          this.columns = savedColumns.map((savedCol) => {
            const original = this.columnsConfig.find(c => c.name === savedCol.name) || {};
            return {
              ...savedCol,
              component: original.component,
              props: original.props,
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
          visible: true,
          size: col.size ?? null,
        }));
      }
    },
    resetColumns() {
      this.columns = this.columnsConfig.map((col, index) => ({
        ...col,
        sort_index: index,
        visible: true,
        size: col.size ?? null,
      }));
      this.saveColumns();
    },
    saveColumns() {
      // Filter out non-serializable properties before saving
      const serializableColumns = this.columns.map(col => {
        const { component, props, ...serializableCol } = col;
        return serializableCol;
      });
      localStorage.setItem(`tableColumns_${this.tableKey}`, JSON.stringify(serializableColumns));
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
    saveSort() {
      localStorage.setItem(
        `tableSort_${this.tableKey}`,
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
      const newWidth = Math.max(50, this.startWidth + dx);
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
  },
  mounted() {
    this.loadColumns();

    const saved = localStorage.getItem(`tableSort_${this.tableKey}`);
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