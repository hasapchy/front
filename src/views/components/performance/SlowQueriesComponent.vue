<template>
  <div v-if="slowQueries && !slowQueries.error" class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Медленные запросы</h2>
      
      <div v-if="slowQueries.summary" class="mb-6">
        <h3 class="text-md font-medium text-gray-800 mb-3">Сводка</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600">Всего медленных запросов</div>
            <div class="text-xl font-bold text-red-800">{{ slowQueries.summary.total_slow_queries }}</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600">Среднее время</div>
            <div class="text-xl font-bold text-red-800">{{ slowQueries.summary.avg_execution_time }} мс</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600">Максимальное время</div>
            <div class="text-xl font-bold text-red-800">{{ slowQueries.summary.max_execution_time }} мс</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <div class="text-sm text-red-600">Всего выполнений</div>
            <div class="text-xl font-bold text-red-800">{{ slowQueries.summary.total_executions }}</div>
          </div>
        </div>
      </div>

      <div v-if="slowQueries.slow_queries && slowQueries.slow_queries.length > 0" class="space-y-4">
        <div v-for="(query, index) in slowQueries.slow_queries" :key="index" class="bg-red-50 p-4 rounded-lg">
          <div class="text-sm text-red-600 mb-2">SQL запрос:</div>
          <div class="bg-white p-3 rounded border font-mono text-sm text-gray-800 mb-3">{{ query.sql_text }}</div>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span class="text-red-600">Выполнений:</span>
              <span class="font-medium">{{ query.exec_count }}</span>
            </div>
            <div>
              <span class="text-red-600">Среднее время:</span>
              <span class="font-medium">{{ query.avg_time_ms }} мс</span>
            </div>
            <div>
              <span class="text-red-600">Макс. время:</span>
              <span class="font-medium">{{ query.max_time_ms }} мс</span>
            </div>
            <div>
              <span class="text-red-600">Строк обработано:</span>
              <span class="font-medium">{{ query.total_rows_examined }}</span>
            </div>
            <div>
              <span class="text-red-600">Временных таблиц:</span>
              <span class="font-medium">{{ query.total_tmp_tables }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SlowQueriesComponent',
  props: {
    slowQueries: {
      type: Object,
      default: null
    }
  }
};
</script>
