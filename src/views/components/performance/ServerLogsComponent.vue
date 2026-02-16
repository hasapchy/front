<template>
  <div class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Логи сервера</h2>
        <button
          @click="loadServerLogs"
          :disabled="logsLoading"
          class="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': logsLoading }"></i>
          <span>Обновить</span>
        </button>
      </div>

      <div v-if="logsLoading" class="min-h-64">
        <TableSkeleton />
      </div>
      <div v-else-if="logsError" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">{{ logsError }}</div>

      <div v-else>
        <div v-if="selectedLog">
          <div class="text-sm text-gray-600 mb-2">
            <span v-if="selectedLog.size">Размер: {{ selectedLog.size }}</span>
            <span v-if="selectedLog.last_modified" class="ml-4">Изменён: {{ selectedLog.last_modified }}</span>
          </div>

          <div class="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-64 overflow-auto font-mono text-xs">
            <div v-if="selectedLog.lines && selectedLog.lines.length > 0">
              <div v-for="(line, idx) in selectedLog.lines" :key="idx" class="whitespace-pre">{{ line }}</div>
            </div>
            <div v-else class="text-gray-400">Нет данных в логах Laravel</div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-600">Логи Laravel недоступны.</div>
      </div>
    </div>
  </div>
</template>

<script>
import PerformanceController from '@/api/PerformanceController';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
  name: 'ServerLogsComponent',
  components: { TableSkeleton },
  mixins: [notificationMixin],
  data() {
    return {
      serverLogs: null,
      logsLoading: false,
      logsError: null
    };
  },
  computed: {
    selectedLog() {
      if (!this.serverLogs) return null;
      return this.serverLogs.laravel;
    }
  },
  async mounted() {
    await this.loadServerLogs();
  },
  methods: {
    async loadServerLogs() {
      this.logsLoading = true;
      this.logsError = null;
      try {
        const logs = await PerformanceController.getServerLogs();
        this.serverLogs = logs;
      } catch (error) {
        this.logsError = error.response?.data?.message || error.message || 'Не удалось загрузить логи';
        this.showNotification('Ошибка загрузки логов', this.logsError, true);
      } finally {
        this.logsLoading = false;
      }
    }
  }
};
</script>
