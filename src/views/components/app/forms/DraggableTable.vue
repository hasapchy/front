<template>
  <!-- {{ tableData }} -->
  <!-- Кнопка настройки колонны  -->
  <div class="flex flex-row-reverse">
    <TableFilterButton v-if="columns.length">
      <ul>
        <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
          <li @click="toggleVisible(index)" class="flex items-center hover:bg-gray-100 p-2 rounded"
            v-for="element, index in columns" :key="element.name">
            <div class="space-x-2 flex flex-row justify-between w-full select-none">
              <div><i class="text-sm mr-2 text-[#337AB7]"
                  :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>{{ element.label }}</div>
              <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
            </div>
          </li>
        </draggable>
      </ul>
      <div class="flex flex-row-reverse">
        <button @click="resetColumns" class="text-[#337AB7] hover:underline mr-3 cursor-pointer">
          Сбросить
        </button>
      </div>
    </TableFilterButton>
  </div>
  <!-- Сама таблица -->
  <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
    <thead class="bg-gray-100 rounded-t-sm">
      <draggable v-if="columns.length" tag="tr" class="dragArea list-group w-full" :list="columns" @change="log">
        <th class="text-left border border-gray-300 py-2 px-4 font-medium cursor-move" v-for="element in columns"
          :key="element.name" :class="{ 'hidden': !element.visible }">
          <span>
            {{ element.label }}
          </span>
        </th>
      </draggable>
    </thead>
    <tbody>
      <tr v-for="item, index in tableData" :key="item" class="cursor-pointer hover:bg-gray-100 transition-all"
        :class="{ 'border-b border-gray-300': index !== tableData.length - 1 }" @click="() => { itemClick(item) }">
        <td v-for="column in columns" :key="`${column}${item}`" class="py-2 px-4 border-x border-gray-300"
          :class="{ 'hidden': !column.visible, 'w-15': column.size }">
          <img v-if="column.image && itemMapper(item, column.name) !== null" :src="itemMapper(item, column.name)" alt=""
            width="50px" class="rounded">
          <span v-else-if="column.html" v-html="itemMapper(item, column.name)"></span>
          <span v-else>
            {{ itemMapper(item, column.name) }} </span>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next'
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';

export default {
  components: { draggable: VueDraggableNext, TableFilterButton },
  props: {
    tableKey: {
      type: String,
      required: true
    },
    columnsConfig: {
      type: Array,
      required: true
    },
    tableData: {
      type: Array,
      required: true
    },
    itemMapper: {
      type: Function,
      required: true
    },
    onItemClick: {
      type: Function,
      required: false
    }
  },
  data() {
    return {
      columns: [],
      ///
      enabled: true,
      dragging: false,
    };
  },
  // computed: {
  //   visibleColumns() {
  //     return this.columns.filter(col => col.visible);
  //   }
  // },
  methods: {
    loadColumns() {
      const saved = localStorage.getItem(`tableColumns_${this.tableKey}`);
      if (saved) {
        console.log('saved', saved);
        this.columns = JSON.parse(saved);
      } else {
        console.log('not saved');
        this.columns = this.columnsConfig.map((col, index) => {
          return { ...col, sort_index: index, visible: true };
        });
      }
    },
    resetColumns() {
      this.columns = this.columnsConfig.map((col, index) => {
        return { ...col, sort_index: index, visible: true };
      });
      this.saveColumns();
    },
    saveColumns() {
      localStorage.setItem(`tableColumns_${this.tableKey}`, JSON.stringify(this.columns));
    },
    toggleVisible(index) {
      this.columns[index].visible = !this.columns[index].visible;
      this.saveColumns();
    },
    log(event) {
      this.columns = this.columns.map((col, index) => {
        return { name: col.name, label: col.label, size: col.size, image: col.image ?? false, visible: col.visible, sort_index: index };
      });
      this.saveColumns();
    },
    itemClick(i) {
      if (this.onItemClick != null) {
        this.onItemClick(i);
      }
    }
  },
  mounted() {
    this.loadColumns();
  }
};
</script>

<style scoped>
th,
td {
  text-align: left;
}
</style>