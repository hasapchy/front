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
  <!-- Кнопка удалить -->
  <div class="mb-4" v-if="selectedRows.length > 0">
    <button @click="deleteSelectedRows" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
      Удалить выбранные ({{ selectedRows.length }})
    </button>
  </div>

  <!-- Таблица -->
  <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
    <thead class="bg-gray-100 rounded-t-sm">
      <tr v-if="columns.length" class="dragArea list-group w-full">
        <th class="border border-gray-300 py-2 px-4 w-12">
          <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="cursor-pointer" />
        </th>
        <th v-for="(element, index) in columns" :key="element.name"
          :class="{ hidden: !element.visible, relative: true }"
          class="text-left border border-gray-300 py-2 px-4 font-medium cursor-pointer select-none"
          :style="{ width: element.size ? element.size + 'px' : 'auto' }" @click.prevent="sortBy(element.name)">
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
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="sortedData.length === 0" class="text-center">
        <td class="py-2 px-4 border-x border-gray-300" :colspan="columns.length + 1">
          Нет данных
        </td>
      </tr>
      <tr v-for="(item, idx) in sortedData" :key="idx" class="cursor-pointer hover:bg-gray-100 transition-all"
        :class="{ 'border-b border-gray-300': idx !== sortedData.length - 1 }" @click="() => itemClick(item)">
        <td class="py-2 px-4 border-x border-gray-300 w-12">
          <input type="checkbox" v-model="selectedRows" :value="item" class="cursor-pointer" @click.stop />
        </td>
        <td v-for="(column, cIndex) in columns" :key="`${cIndex}_${idx}`" class="py-2 px-4 border-x border-gray-300"
          :class="{ hidden: !column.visible }" :style="{ width: column.size ? column.size + 'px' : 'auto' }">
          <img v-if="column.image && itemMapper(item, column.name) !== null" :src="itemMapper(item, column.name)"
            width="50" class="rounded" />
          <span v-else-if="column.html" v-html="itemMapper(item, column.name)"></span>
          <span v-else>{{ itemMapper(item, column.name) }}</span>
        </td>
      </tr>
    </tbody>
  </table>

</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';

export default {
  name: 'ResizableTable',
  components: { draggable: VueDraggableNext, TableFilterButton },
  props: {
    tableKey: { type: String, required: true },
    columnsConfig: { type: Array, required: true },
    tableData: { type: Array, required: true },
    itemMapper: { type: Function, required: true },
    onItemClick: { type: Function },
    onDeleteRows: { type: Function },
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
      selectedRows: [],
      selectAll: false,
    };
  },
  watch: {
    tableData() {
      this.selectedRows = [];
      this.selectAll = false;
    }
  },
  computed: {
    sortedData() {
      if (!this.sortKey) {
        return this.tableData;
      }
      return [...this.tableData].sort((a, b) => {
        const va = this.itemMapper(a, this.sortKey);
        const vb = this.itemMapper(b, this.sortKey);
        const da = Date.parse(va), db = Date.parse(vb);
        if (!isNaN(da) && !isNaN(db)) {
          return (da - db) * this.sortOrder;
        }
        if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) {
          return (parseFloat(va) - parseFloat(vb)) * this.sortOrder;
        }
        return va.toString().localeCompare(vb.toString()) * this.sortOrder;
      });
    }
  },
  methods: {
    loadColumns() {
      const saved = localStorage.getItem(`tableColumns_${this.tableKey}`);
      if (saved) {
        this.columns = JSON.parse(saved);
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
      localStorage.setItem(`tableColumns_${this.tableKey}`, JSON.stringify(this.columns));
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
    itemClick(i) {
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
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedRows = [...this.sortedData];
      } else {
        this.selectedRows = [];
      }
    },
    deleteSelectedRows() {
      if (this.selectedRows.length > 0) {
        this.$emit('delete-rows', this.selectedRows);
        this.selectedRows = [];
        this.selectAll = false;
      }
    },
    /* ---------- Новое от Эмиля.Это на случай, если ты начнешь смотреть ресайз колонок ---------- */
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

<style scoped>
th,
td {
  text-align: left;
}

.resize-handle {
  transition: background-color 0.15s ease;
}

.resize-handle:hover {
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
