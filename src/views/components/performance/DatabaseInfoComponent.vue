<template>
  <div v-if="databaseInfo" class="mb-6">
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Информация о базе данных</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm text-gray-600">Драйвер</div>
          <div class="text-lg font-medium">{{ databaseInfo.driver }}</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm text-gray-600">Версия</div>
          <div class="text-lg font-medium">{{ databaseInfo.version }}</div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="text-sm text-gray-600">Макс. соединений</div>
          <div class="text-lg font-medium">{{ databaseInfo.variables?.max_connections || 'N/A' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DatabaseInfoComponent',
  props: {
    databaseInfo: {
      type: Object,
      default: null
    }
  }
};
</script>
