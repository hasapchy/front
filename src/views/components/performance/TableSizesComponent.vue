<template>
  <div class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">{{ $t('tableSizes') }}</h2>
        <button
          @click="refreshTableSizes"
          :disabled="loading"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-table" :class="{ 'fa-spin': loading }"></i>
          <span>{{ $t('refreshMetrics') }}</span>
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-100 rounded text-red-700">
        <div class="font-medium">{{ $t('loadError') }}</div>
        <div>{{ error }}</div>
      </div>
      
      <div v-if="!Array.isArray(tableSizes) || tableSizes.length === 0" class="mb-4 p-3 bg-yellow-100 rounded text-yellow-700">
        <div class="font-medium">{{ $t('tableSizesUnavailable') }}</div>
        <div>{{ $t('tableSizesUnavailableHint') }}</div>
        <div class="mt-2">
          <button 
            @click="refreshTableSizes"
            class="text-sm text-yellow-600 hover:text-yellow-800 underline"
          >
            {{ $t('tryAgain') }}  
          </button>
        </div>
      </div>
      
      <div v-if="Array.isArray(tableSizes) && tableSizes.length > 0" class="overflow-x-auto max-h-96">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('table') }}</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('size') }} (MB)</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('rowCount') }}</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(table, index) in tableSizes" :key="index">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ table.table_name || table.TABLE_NAME || `${$t('table')} ${index + 1}` }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ table.size_mb || table.SIZE_MB || table.size || $t('notSpecified') }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ (table.table_rows !== undefined && table.table_rows !== null) || (table.TABLE_ROWS !== undefined && table.TABLE_ROWS !== null) || (table.rows !== undefined && table.rows !== null) ? 
                   ((table.table_rows !== undefined && table.table_rows !== null) ? table.table_rows : 
                    (table.TABLE_ROWS !== undefined && table.TABLE_ROWS !== null) ? table.TABLE_ROWS : 
                    table.rows).toLocaleString() : $t('notSpecified') }}
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
  async mounted() {
    if (!this.tableSizes || this.tableSizes.length === 0) {
      await this.refreshTableSizes();
    }
  },
  methods: {
    async refreshTableSizes() {
      this.loading = true;
      this.error = null;
      
      try {
        const tableSizes = await PerformanceController.getTableSizes();
        this.$emit('update-table-sizes', tableSizes);
        this.showNotification(this.$t('tableSizesUpdated'), '', false);
      } catch (error) {
        if (error.response?.status === 404) {
          this.error = this.$t('tableSizesEndpointNotFound');
        } else if (error.response?.status === 401) {
          this.error = this.$t('authRequired');
        } else if (error.response?.status === 403) {
          this.error = this.$t('insufficientPermissions');
        } else if (error.response?.status >= 500) {
          this.error = this.$t('serverErrorTryLater');
        } else {
          this.error = error.response?.data?.message || error.message;
        }
        
        this.showNotification(this.$t('errorLoadingTableSizes'), this.error, true);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
