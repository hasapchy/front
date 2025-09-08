<template>
  <div class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Размеры таблиц</h2>
        <button
          @click="refreshTableSizes"
          :disabled="loading"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-table" :class="{ 'fa-spin': loading }"></i>
          <span>Обновить</span>
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 rounded text-red-700">
        <div class="font-medium">Ошибка получения данных:</div>
        <div>{{ error }}</div>
      </div>
      
      <div v-if="!Array.isArray(tableSizes) || tableSizes.length === 0" class="mb-4 p-3 bg-yellow-100 rounded text-yellow-700">
        <div class="font-medium">Данные о размерах таблиц недоступны</div>
        <div>Попробуйте обновить данные или проверьте права доступа к базе данных</div>
      </div>
      
      <div v-if="Array.isArray(tableSizes) && tableSizes.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Таблица</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Размер (МБ)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество строк</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(table, index) in tableSizes" :key="index">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ table.table_name || table.TABLE_NAME || `Таблица ${index + 1}` }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ table.size_mb || table.SIZE_MB || table.size || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ (table.table_rows !== undefined && table.table_rows !== null) || (table.TABLE_ROWS !== undefined && table.TABLE_ROWS !== null) || (table.rows !== undefined && table.rows !== null) ? 
                   ((table.table_rows !== undefined && table.table_rows !== null) ? table.table_rows : 
                    (table.TABLE_ROWS !== undefined && table.TABLE_ROWS !== null) ? table.TABLE_ROWS : 
                    table.rows).toLocaleString() : 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import PerformanceController from '@/api/PerformanceController';
import notificationMixin from '@/mixins/notificationMixin';

export default {
  name: 'TableSizesComponent',
  mixins: [notificationMixin],
  props: {
    tableSizes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      error: null
    };
  },
  methods: {
    async refreshTableSizes() {
      this.loading = true;
      this.error = null;
      
      try {
        const tableSizes = await PerformanceController.getTableSizes();
        this.$emit('update-table-sizes', tableSizes);
        this.showNotification('Размеры таблиц обновлены', '', false);
      } catch (error) {
        if (error.response?.status === 404) {
          this.error = 'API endpoint для размеров таблиц не найден. Возможно, функция еще не реализована на сервере.';
        } else if (error.response?.status === 401) {
          this.error = 'Необходима авторизация для выполнения этой операции.';
        } else if (error.response?.status === 403) {
          this.error = 'Недостаточно прав для выполнения этой операции.';
        } else if (error.response?.status >= 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        }
        
        this.showNotification('Ошибка загрузки размеров таблиц', this.error, true);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
