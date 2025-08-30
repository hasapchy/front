<template>
  <div class="p-6">

    <!-- Статус JWT токенов -->
    <div class="mb-6">
      <TokenStatusComponent />
    </div>

    <!-- Кнопки управления -->
    <div class="mb-6 flex flex-wrap gap-4">
      <!-- Основные кнопки -->
      <button
        @click="refreshMetrics"
        :disabled="loading"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        <span>Обновить метрики</span>
      </button>
      
      <button
        @click="runFullTest"
        :disabled="loading"
        class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-play"></i>
        <span>Запустить полный тест</span>
      </button>

      <!-- Выпадающий список для тестов -->
      <div class="relative">
        <button
          @click="toggleTestDropdown"
          :disabled="loading"
          class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-vial"></i>
          <span>Тесты производительности</span>
          <i class="fas fa-chevron-down ml-2" :class="{ 'fa-chevron-up': showTestDropdown }"></i>
        </button>
        
        <!-- Выпадающее меню -->
        <div 
          v-if="showTestDropdown" 
          class="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10 transition-all duration-200 ease-in-out transform origin-top"
          :class="{ 'scale-95 opacity-0': !showTestDropdown, 'scale-100 opacity-100': showTestDropdown }"
        >
          <div class="py-2">
            <button
              @click="runSalesTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-chart-line text-purple-600"></i>
              <span>Тест продаж</span>
            </button>
            
            <button
              @click="runClientsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-users text-blue-600"></i>
              <span>Тест клиентов</span>
            </button>
            
            <button
              @click="runProductsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-box text-green-600"></i>
              <span>Тест продуктов</span>
            </button>
            
            <button
              @click="runTransactionsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-money-bill-wave text-yellow-600"></i>
              <span>Тест транзакций</span>
            </button>
            
            <button
              @click="runWarehousesTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-warehouse text-indigo-600"></i>
              <span>Тест складов</span>
            </button>
            
            <button
              @click="runOrdersTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-shopping-cart text-pink-600"></i>
              <span>Тест заказов</span>
            </button>
            
            <button
              @click="runProjectsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-project-diagram text-orange-600"></i>
              <span>Тест проектов</span>
            </button>
            
            <button
              @click="runUsersTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-user-friends text-teal-600"></i>
              <span>Тест пользователей</span>
            </button>
            
            <button
              @click="runCommentsTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-comments text-cyan-600"></i>
              <span>Тест комментариев</span>
            </button>
            
            <button
              @click="runTimelineTest"
              :disabled="loading"
              class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2"
            >
              <i class="fas fa-clock text-violet-600"></i>
              <span>Тест таймлайна</span>
            </button>
            

          </div>
        </div>
      </div>

      <!-- Кнопки управления кэшем -->
      <button
        @click="getCacheStats"
        :disabled="loading"
        class="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-database"></i>
        <span>Статистика кэша</span>
      </button>

      <button
        @click="clearCache"
        :disabled="loading"
        class="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <i class="fas fa-trash"></i>
        <span>Очистить кэш</span>
      </button>

        <button
          @click="refreshTableSizes"
          :disabled="loading"
          class="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-table"></i>
          <span>Обновить размеры таблиц</span>
        </button>

        <!-- Новые кнопки для расширенного мониторинга -->
        <button
          @click="analyzeIndexes"
          :disabled="loading"
          class="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 relative"
          :title="performanceRecommendations?.error ? 'Функция недоступна: требуется MySQL 5.6+ с performance_schema' : 'Анализ индексов базы данных'"
        >
          <i class="fas fa-search" :class="{ 'fa-spin': loading && !performanceRecommendations }"></i>
          <span>Анализ индексов</span>
          <span v-if="performanceRecommendations?.error" class="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <i class="fas fa-exclamation-triangle"></i>
          </span>
        </button>

        <button
          @click="getRealTimeMetrics"
          :disabled="loading"
          class="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 relative"
          :title="realTimeMetrics?.error ? 'Функция недоступна: требуется MySQL 5.6+ с performance_schema' : 'Метрики производительности в реальном времени'"
        >
          <i class="fas fa-chart-line" :class="{ 'fa-spin': loading && !realTimeMetrics }"></i>
          <span>Метрики в реальном времени</span>
          <span v-if="realTimeMetrics?.error" class="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <i class="fas fa-exclamation-triangle"></i>
          </span>
        </button>

        <!-- Кнопка проверки доступности функций -->
        <button
          @click="checkFeatureAvailability"
          :disabled="loading"
          class="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <i class="fas fa-check-circle"></i>
          <span>Проверить доступность функций</span>
        </button>
      </div>

    <!-- Логи сервера -->
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

        <div v-if="logsLoading" class="text-gray-600">Загрузка логов...</div>
        <div v-else-if="logsError" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">{{ logsError }}</div>

        <div v-else>
          <div v-if="availableLogs.length > 0">
            <div class="border-b border-gray-200 mb-4">
              <nav class="flex flex-wrap gap-2">
                <button
                  v-for="tab in availableLogs"
                  :key="tab.key"
                  @click="selectedLogKey = tab.key"
                  class="px-3 py-1.5 rounded-md text-sm"
                  :class="selectedLogKey === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                >
                  {{ tab.label }}
                </button>
              </nav>
            </div>

            <div class="text-sm text-gray-600 mb-2">
              <span v-if="selectedLog && selectedLog.size">Размер: {{ selectedLog.size }}</span>
              <span v-if="selectedLog && selectedLog.last_modified" class="ml-4">Изменён: {{ selectedLog.last_modified }}</span>
            </div>

            <div class="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-auto font-mono text-xs">
              <div v-if="selectedLog && selectedLog.lines && selectedLog.lines.length > 0">
                <div v-for="(line, idx) in selectedLog.lines" :key="idx" class="whitespace-pre">{{ line }}</div>
              </div>
              <div v-else class="text-gray-400">Нет данных для выбранного лога</div>
            </div>
          </div>

          <div v-else class="text-sm text-gray-600">Логи недоступны.</div>
        </div>
      </div>
    </div>

    <!-- Информация о базе данных -->
    <div v-if="metrics.database_info" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Информация о базе данных</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Драйвер</div>
            <div class="text-lg font-medium">{{ metrics.database_info.driver }}</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Версия</div>
            <div class="text-lg font-medium">{{ metrics.database_info.version }}</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-sm text-gray-600">Макс. соединений</div>
            <div class="text-lg font-medium">{{ metrics.database_info.variables?.max_connections || 'N/A' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Информация о доступности функций -->
    <div class="mb-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-info-circle text-blue-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">Информация о функциях мониторинга</h3>
            <div class="mt-2 text-sm text-blue-700">
              <p class="mb-2">• <strong>Основные метрики:</strong> Доступны для всех версий MySQL</p>
              <p class="mb-2">• <strong>Анализ индексов:</strong> Требует включенный performance_schema (MySQL 5.6+)</p>
              <p class="mb-2">• <strong>Метрики в реальном времени:</strong> Требуют включенный performance_schema (MySQL 5.6+)</p>
              <p class="mb-2">• <strong>Размеры таблиц:</strong> Доступны для всех версий MySQL</p>
              <p class="mb-2">• <strong>Медленные запросы:</strong> Требуют включенный slow query log</p>
              <p class="mb-0">• <strong>Примечание:</strong> MySQL 8.0.30 поддерживает все функции, но performance_schema может быть отключен</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Результаты проверки доступности функций -->
    <div v-if="featureAvailability" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Доступность функций мониторинга</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(available, feature) in featureAvailability" :key="feature" class="flex items-center p-3 rounded-lg" :class="available ? 'bg-green-50' : 'bg-red-50'">
            <i class="fas mr-3 text-lg" :class="available ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'"></i>
            <div>
              <div class="font-medium" :class="available ? 'text-green-800' : 'text-red-800'">
                {{ getFeatureDisplayName(feature) }}
              </div>
              <div class="text-sm" :class="available ? 'text-green-600' : 'text-red-600'">
                {{ available ? 'Доступна' : 'Недоступна' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция с рекомендациями по производительности -->
    <div v-if="performanceRecommendations" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Рекомендации по производительности</h2>
        
        <!-- Сообщение о недоступности -->
        <div v-if="performanceRecommendations.error" class="mb-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Функция недоступна</h3>
                                 <div class="mt-2 text-sm text-yellow-700">
                   <p>{{ performanceRecommendations.message }}</p>
                   <p class="mt-2">Версия MySQL: {{ performanceRecommendations.mysql_version === 'legacy' ? 'Устаревшая (требуется 5.6+)' : 
                     performanceRecommendations.mysql_version === 'modern_but_disabled' ? 'Современная (8.0.30), но performance_schema отключен' : 
                     performanceRecommendations.mysql_version }}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Рекомендации (если доступны) -->
        <div v-if="performanceRecommendations.recommendations && performanceRecommendations.recommendations.length > 0" class="space-y-3">
          <div 
            v-for="(rec, index) in performanceRecommendations.recommendations" 
            :key="index"
            class="p-4 rounded-lg border-l-4"
            :class="{
              'border-red-500 bg-red-50': rec.priority === 'critical',
              'border-orange-500 bg-orange-50': rec.priority === 'high',
              'border-yellow-500 bg-yellow-50': rec.priority === 'medium',
              'border-blue-500 bg-blue-50': rec.type === 'version_requirement',
              'border-green-500 bg-green-50': rec.type === 'alternative_method'
            }"
          >
            <div class="flex items-start">
              <i 
                class="fas mt-1 mr-3"
                :class="{
                  'fa-exclamation-triangle text-red-600': rec.priority === 'critical',
                  'fa-exclamation-circle text-orange-600': rec.priority === 'high',
                  'fa-info-circle text-yellow-600': rec.priority === 'medium',
                  'fa-info-circle text-blue-600': rec.type === 'version_requirement',
                  'fa-lightbulb text-green-600': rec.type === 'alternative_method'
                }"
              ></i>
              <div>
                <div class="font-medium text-gray-900">{{ rec.message }}</div>
                <div v-if="rec.sql" class="mt-2 text-sm text-gray-600">
                  <code class="bg-gray-100 px-2 py-1 rounded">{{ rec.sql }}</code>
                </div>
                <div v-if="rec.type === 'alternative_method'" class="mt-2 text-sm text-green-600">
                  <i class="fas fa-lightbulb mr-1"></i>
                  Альтернативный метод для старых версий MySQL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Метрики в реальном времени -->
    <div v-if="realTimeMetrics" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Метрики в реальном времени</h2>
        
        <!-- Сообщение о недоступности -->
        <div v-if="realTimeMetrics.error" class="mb-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-yellow-400"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-yellow-800">Функция недоступна</h3>
                                 <div class="mt-2 text-sm text-yellow-700">
                   <p>{{ realTimeMetrics.message }}</p>
                   <p class="mt-2">Версия MySQL: {{ realTimeMetrics.mysql_version === 'legacy' ? 'Устаревшая (требуется 5.6+)' : 
                     realTimeMetrics.mysql_version === 'modern_but_disabled' ? 'Современная (8.0.30), но performance_schema отключен' : 
                     realTimeMetrics.mysql_version }}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Fallback данные для старых версий -->
        <div v-if="realTimeMetrics.fallback_data" class="mb-6">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 class="text-md font-medium text-gray-800 mb-3">Базовая информация (fallback)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600">Активные соединения</div>
                <div class="text-lg font-medium text-gray-800">{{ realTimeMetrics.fallback_data.active_connections }}</div>
              </div>
              <div class="bg-gray-100 p-4 rounded-lg">
                <div class="text-sm text-gray-600">Максимум соединений</div>
                <div class="text-lg font-medium text-gray-800">{{ realTimeMetrics.fallback_data.max_connections }}</div>
              </div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              <p>Для получения детальных метрик в реальном времени обновите MySQL до версии 5.6+ и включите performance_schema.</p>
            </div>
          </div>
        </div>
        
        <!-- Обычные метрики (если доступны) -->
        <div v-if="!realTimeMetrics.error">
          <!-- Активные соединения -->
          <div v-if="realTimeMetrics.active_connections" class="mb-6">
            <h3 class="text-md font-medium text-gray-800 mb-3">Активные соединения</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Активные соединения</div>
                <div class="text-xl font-bold text-blue-800">{{ realTimeMetrics.active_connections[0]?.active_connections || 'N/A' }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Максимум соединений</div>
                <div class="text-xl font-bold text-blue-800">{{ realTimeMetrics.active_connections[1]?.max_connections || 'N/A' }}</div>
              </div>
            </div>
          </div>

          <!-- Статистика InnoDB -->
          <div v-if="realTimeMetrics.innodb_stats" class="mb-6">
            <h3 class="text-md font-medium text-gray-800 mb-3">Статистика InnoDB</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="(stat, index) in realTimeMetrics.innodb_stats.slice(0, 6)" :key="index" class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">{{ stat.Variable_name }}</div>
                <div class="text-lg font-medium text-green-800">{{ stat.Value }}</div>
              </div>
            </div>
          </div>

          <!-- Размер буфера -->
          <div v-if="realTimeMetrics.buffer_stats" class="mb-6">
            <h3 class="text-md font-medium text-gray-800 mb-3">Настройки буфера</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="(stat, index) in realTimeMetrics.buffer_stats" :key="index" class="bg-purple-50 p-4 rounded-lg">
                <div class="text-sm text-purple-600">{{ stat.Variable_name }}</div>
                <div class="text-lg font-medium text-purple-800">{{ stat.Value }}</div>
              </div>
            </div>
          </div>

          <!-- Время обновления -->
          <div v-if="realTimeMetrics.timestamp" class="text-sm text-gray-500 text-center">
            Последнее обновление: {{ new Date(realTimeMetrics.timestamp).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- Метрики производительности продаж -->
    <div v-if="metrics.sales_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов продаж</h2>
        
        <!-- Список продаж -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Список продаж (без фильтров)</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Время выполнения</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.sales_performance.list_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Использование памяти</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.sales_performance.list_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Количество запросов</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.sales_performance.list_performance?.total_queries }}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Записей на странице</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.sales_performance.list_performance?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Поиск продаж -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Поиск продаж</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Время выполнения</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.sales_performance.search_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Использование памяти</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.sales_performance.search_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Количество запросов</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.sales_performance.search_performance?.total_queries }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Записей на странице</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.sales_performance.search_performance?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Фильтр по дате -->
        <div>
          <h3 class="text-md font-medium text-gray-800 mb-3">Фильтр по дате</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Время выполнения</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.sales_performance.date_filter_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Использование памяти</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.sales_performance.date_filter_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Количество запросов</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.sales_performance.date_filter_performance?.total_queries }}</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Записей на странице</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.sales_performance.date_filter_performance?.items_count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Метрики производительности клиентов -->
    <div v-if="metrics.clients_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов клиентов</h2>
        
        <!-- Список клиентов -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Список клиентов (без фильтров)</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Время выполнения</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.clients_performance.list_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Использование памяти</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.clients_performance.list_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Количество запросов</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.clients_performance.list_performance?.total_queries }}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Записей на странице</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.clients_performance.list_performance?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Поиск клиентов -->
        <div>
          <h3 class="text-md font-medium text-gray-800 mb-3">Поиск клиентов</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Время выполнения</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.clients_performance.search_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Использование памяти</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.clients_performance.search_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Количество запросов</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.clients_performance.search_performance?.total_queries }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Записей найдено</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.clients_performance.search_performance?.items_count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Метрики производительности продуктов -->
    <div v-if="metrics.products_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов продуктов</h2>
        
        <!-- Список продуктов -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Список продуктов (без фильтров)</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Время выполнения</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.products_performance.list_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Использование памяти</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.products_performance.list_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Количество запросов</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.products_performance.list_performance?.total_queries }}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Записей на странице</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.products_performance.list_performance?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Поиск продуктов -->
        <div>
          <h3 class="text-md font-medium text-gray-800 mb-3">Поиск продуктов</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Время выполнения</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.products_performance.search_performance?.execution_time }} мс</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Использование памяти</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.products_performance.search_performance?.memory_usage }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Количество запросов</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.products_performance.search_performance?.total_queries }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Записей найдено</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.products_performance.search_performance?.items_count }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Размеры таблиц -->
    <div v-if="metrics.table_sizes && !metrics.table_sizes.error" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Размеры таблиц</h2>
        

        
        <!-- Проверка на ошибки -->
        <div v-if="metrics.table_sizes.error" class="mb-4 p-3 bg-red-100 rounded text-red-700">
          <div class="font-medium">Ошибка получения данных:</div>
          <div>{{ metrics.table_sizes.error }}</div>
        </div>
        
        <!-- Проверка на пустые данные -->
        <div v-if="!Array.isArray(metrics.table_sizes) || metrics.table_sizes.length === 0" class="mb-4 p-3 bg-yellow-100 rounded text-yellow-700">
          <div class="font-medium">Данные о размерах таблиц недоступны</div>
          <div>Попробуйте обновить данные или проверьте права доступа к базе данных</div>
        </div>
        
        <div v-if="Array.isArray(metrics.table_sizes) && metrics.table_sizes.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Таблица</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Размер (МБ)</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество строк</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(table, index) in metrics.table_sizes" :key="index">
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

    <!-- Информация о кэше -->
    <div v-if="metrics.cache_stats" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Информация о кэше</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Тип кэша</div>
            <div class="text-lg font-medium">{{ metrics.cache_stats.type }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Драйвер</div>
            <div class="text-lg font-medium">{{ metrics.cache_stats.driver }}</div>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-sm text-blue-600">Статус</div>
            <div class="text-lg font-medium">{{ metrics.cache_stats.status }}</div>
          </div>
        </div>
        
        <div v-if="metrics.cache_size && !metrics.cache_size.error" class="mt-4">
          <h3 class="text-md font-medium text-gray-800 mb-3">Размер кэша</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Размер</div>
              <div class="text-lg font-medium">{{ metrics.cache_size.size_mb }} МБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">В КБ</div>
              <div class="text-lg font-medium">{{ metrics.cache_size.size_kb }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">В байтах</div>
              <div class="text-lg font-medium">{{ metrics.cache_size.size_bytes.toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Медленные запросы -->
    <div v-if="metrics.slow_queries && !metrics.slow_queries.error" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Медленные запросы</h2>
        
        <!-- Сводка -->
        <div v-if="metrics.slow_queries.summary" class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Сводка</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm text-red-600">Всего медленных запросов</div>
              <div class="text-xl font-bold text-red-800">{{ metrics.slow_queries.summary.total_slow_queries }}</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm text-red-600">Среднее время</div>
              <div class="text-xl font-bold text-red-800">{{ metrics.slow_queries.summary.avg_execution_time }} мс</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm text-red-600">Максимальное время</div>
              <div class="text-xl font-bold text-red-800">{{ metrics.slow_queries.summary.max_execution_time }} мс</div>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="text-sm text-red-600">Всего выполнений</div>
              <div class="text-xl font-bold text-red-800">{{ metrics.slow_queries.summary.total_executions }}</div>
            </div>
          </div>
        </div>

        <!-- Детали запросов -->
        <div v-if="metrics.slow_queries.slow_queries && metrics.slow_queries.slow_queries.length > 0" class="space-y-4">
          <div v-for="(query, index) in metrics.slow_queries.slow_queries" :key="index" class="bg-red-50 p-4 rounded-lg">
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

    <!-- Результаты тестов -->
    <div v-if="testResults" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Результаты тестов производительности</h2>
        
                 <div v-for="(result, testName) in testResults" :key="testName" class="mb-6">
           <h3 class="text-md font-medium text-gray-800 mb-3 capitalize">{{ testName.replace('_', ' ') }}</h3>
           
           <!-- Индикатор производительности -->
           <div class="mb-3">
             <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
                  :class="getPerformanceClass(result)">
               <i class="fas mr-2" :class="getPerformanceIcon(result)"></i>
               {{ getPerformanceText(result) }}
             </div>
           </div>
           
           <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div class="p-4 rounded-lg" :class="getMetricClass(result, 'execution_time_ms')">
               <div class="text-sm" :class="getMetricTextClass(result, 'execution_time_ms')">Время выполнения</div>
               <div class="text-xl font-bold" :class="getMetricValueClass(result, 'execution_time_ms')">{{ result.execution_time_ms }} мс</div>
             </div>
             <div class="p-4 rounded-lg" :class="getMetricClass(result, 'memory_usage_kb')">
               <div class="text-sm" :class="getMetricTextClass(result, 'memory_usage_kb')">Использование памяти</div>
               <div class="text-xl font-bold" :class="getMetricValueClass(result, 'memory_usage_kb')">{{ result.memory_usage_kb }} КБ</div>
             </div>
             <div class="p-4 rounded-lg" :class="getMetricClass(result, 'total_queries')">
               <div class="text-sm" :class="getMetricTextClass(result, 'total_queries')">Количество запросов</div>
               <div class="text-xl font-bold" :class="getMetricValueClass(result, 'total_queries')">{{ result.total_queries }}</div>
             </div>
             <div class="p-4 rounded-lg" :class="getMetricClass(result, 'items_count')">
               <div class="text-sm" :class="getMetricTextClass(result, 'items_count')">Записей</div>
               <div class="text-xl font-bold" :class="getMetricValueClass(result, 'items_count')">{{ result.items_count }}</div>
             </div>
           </div>
          
          <!-- Детали запросов -->
          <div v-if="result.queries && result.queries.length > 0" class="mt-4">
            <details class="bg-gray-50 p-4 rounded-lg">
              <summary class="cursor-pointer text-sm font-medium text-gray-700">Показать детали SQL запросов</summary>
              <div class="mt-3 space-y-2">
                <div v-for="(query, index) in result.queries" :key="index" class="bg-white p-3 rounded border">
                  <div class="text-xs text-gray-500 mb-1">Запрос #{{ index + 1 }}</div>
                  <div class="font-mono text-sm text-gray-800">{{ query.sql }}</div>
                  <div class="text-xs text-gray-500 mt-1">Время: {{ query.time }} мс</div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
        <div class="text-gray-600">Загрузка метрик...</div>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-triangle text-red-400"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Ошибка загрузки</h3>
          <div class="mt-2 text-sm text-red-700">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Предупреждения о недоступных функциях -->
    <div v-if="(performanceRecommendations?.error || realTimeMetrics?.error) && !error" class="mb-6">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Некоторые функции недоступны</h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p class="mb-2">Для использования расширенных функций мониторинга требуется:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>MySQL версии 5.6 или выше (у вас MySQL 8.0.30 ✓)</li>
                <li>Включенный performance_schema</li>
                <li>Достаточные права доступа к системным таблицам</li>
              </ul>
              <p class="mt-2">Основные функции мониторинга (метрики, размеры таблиц, кэш) доступны для всех версий MySQL.</p>
              <p class="mt-2">MySQL 8.0.30 поддерживает все функции, но performance_schema может быть отключен в конфигурации.</p>
              <p class="mt-2">Попробуйте выполнить: <code class="bg-gray-100 px-2 py-1 rounded">SHOW VARIABLES LIKE "performance_schema"</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Метрики производительности комментариев -->
    <div v-if="metrics.comments_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность комментариев и таймлайна</h2>
        
        <!-- Список комментариев -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Список комментариев</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Время выполнения</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.comments_performance.comments_list?.execution_time_ms }} мс</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Использование памяти</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.comments_performance.comments_list?.memory_usage_kb }} КБ</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Количество запросов</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.comments_performance.comments_list?.total_queries }}</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-blue-600">Записей на странице</div>
              <div class="text-xl font-bold text-blue-800">{{ metrics.comments_performance.comments_list?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Поиск комментариев -->
        <div class="mb-6">
          <h3 class="text-md font-medium text-gray-800 mb-3">Поиск комментариев</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Время выполнения</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.comments_performance.comments_search?.execution_time_ms }} мс</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Использование памяти</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.comments_performance.comments_search?.memory_usage_kb }} КБ</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Количество запросов</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.comments_performance.comments_search?.total_queries }}</div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-green-600">Записей найдено</div>
              <div class="text-xl font-bold text-green-800">{{ metrics.comments_performance.comments_search?.items_count }}</div>
            </div>
          </div>
        </div>

        <!-- Таймлайн -->
        <div>
          <h3 class="text-md font-medium text-gray-800 mb-3">Таймлайн</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Время выполнения</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.comments_performance.timeline?.execution_time_ms }} мс</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Использование памяти</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.comments_performance.timeline?.memory_usage_kb }} КБ</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Количество запросов</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.comments_performance.timeline?.total_queries }}</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-purple-600">Записей в таймлайне</div>
              <div class="text-xl font-bold text-purple-800">{{ metrics.comments_performance.timeline?.items_count }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Производительность касс -->
      <div v-if="metrics.cash_registers_performance" class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Производительность касс</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Список касс -->
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список касс</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.cash_registers_performance.cash_registers_list?.execution_time_ms }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.cash_registers_performance.cash_registers_list?.memory_usage_kb }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.cash_registers_performance.cash_registers_list?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.cash_registers_performance.cash_registers_list?.items_count }}</div>
              </div>
            </div>
          </div>

          <!-- Поиск касс -->
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск касс</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.cash_registers_performance.cash_registers_search?.execution_time_ms }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.cash_registers_performance.cash_registers_search?.memory_usage_kb }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.cash_registers_performance.cash_registers_search?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.cash_registers_performance.cash_registers_search?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PerformanceController from '@/api/PerformanceController';
import notificationMixin from '@/mixins/notificationMixin';
import TokenStatusComponent from '@/views/components/app/TokenStatusComponent.vue';

export default {
  name: 'PerformanceMonitorPage',
  mixins: [notificationMixin],
  components: { TokenStatusComponent },
  data() {
    return {
      metrics: {},
      testResults: null,
      loading: false,
      error: null,
      showTestDropdown: false,
      performanceRecommendations: null, // Добавляем для хранения рекомендаций
      realTimeMetrics: null, // Добавляем для хранения метрик в реальном времени
      featureAvailability: null, // Добавляем для хранения информации о доступности функций
      serverLogs: null,
      logsLoading: false,
      logsError: null,
      selectedLogKey: 'laravel'
    };
  },
  async mounted() {
    await this.refreshMetrics();
    await this.loadServerLogs();
    // Добавляем обработчик клика вне выпадающего списка
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    // Убираем обработчик при размонтировании компонента
    document.removeEventListener('click', this.handleClickOutside);
  },
  computed: {
    availableLogs() {
      const tabs = [];
      if (!this.serverLogs) return tabs;
      if (this.serverLogs.laravel) tabs.push({ key: 'laravel', label: 'Laravel' });
      if (this.serverLogs.error) tabs.push({ key: 'error', label: 'error.log' });
      if (this.serverLogs.access) tabs.push({ key: 'access', label: 'access.log' });
      if (this.serverLogs.system?.php_errors) tabs.push({ key: 'system.php_errors', label: 'PHP errors' });
      if (this.serverLogs.system?.apache_errors) tabs.push({ key: 'system.apache_errors', label: 'Apache' });
      if (this.serverLogs.system?.nginx_errors) tabs.push({ key: 'system.nginx_errors', label: 'Nginx' });
      if (this.selectedLogKey && !tabs.some(t => t.key === this.selectedLogKey) && tabs.length > 0) {
        this.selectedLogKey = tabs[0].key;
      }
      return tabs;
    },
    selectedLog() {
      if (!this.serverLogs) return null;
      const key = this.selectedLogKey;
      if (key === 'laravel') return this.serverLogs.laravel;
      if (key === 'error') return this.serverLogs.error;
      if (key === 'access') return this.serverLogs.access;
      if (key === 'system.php_errors') return { lines: this.serverLogs.system?.php_errors || [] };
      if (key === 'system.apache_errors') return { lines: this.serverLogs.system?.apache_errors || [] };
      if (key === 'system.nginx_errors') return { lines: this.serverLogs.system?.nginx_errors || [] };
      return null;
    }
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
    },

    async refreshSystemInfo() {
      this.loading = true;
      this.error = null;
      
      try {
        const metrics = await PerformanceController.getDatabaseMetrics();
        // Обновляем только системную информацию
        this.metrics = { ...this.metrics, ...metrics };
        this.showNotification('Системная информация обновлена', '', false);
      } catch (error) {
        this.showNotification('Ошибка обновления системной информации', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        
        if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.error = error.response.data.error;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Неизвестная ошибка при обновлении системной информации';
        }
      } finally {
        this.loading = false;
      }
    },
    async refreshMetrics() {
      this.loading = true;
      this.error = null;
      
      try {
        this.metrics = await PerformanceController.getDatabaseMetrics();
        this.showNotification('Метрики обновлены', '', false);
      } catch (error) {
        // Показываем уведомление об ошибке
        this.showNotification('Ошибка загрузки метрик', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        
        if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.error = error.response.data.error;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Неизвестная ошибка при загрузке метрик';
        }
      } finally {
        this.loading = false;
      }
    },

    async runFullTest() {
      this.loading = true;
      this.error = null;
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('all');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

    async runSalesTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false; // Закрываем выпадающий список
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('sales_list');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

    async runClientsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false; // Закрываем выпадающий список
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('clients_list');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

    async runProductsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false; // Закрываем выпадающий список
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('products_list');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

    async runTransactionsTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false; // Закрываем выпадающий список
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('transactions_list');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

    async runWarehousesTest() {
      this.loading = true;
      this.error = null;
      this.showTestDropdown = false; // Закрываем выпадающий список
      
      try {
        this.testResults = await PerformanceController.runPerformanceTest('warehouses_list');
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
      } finally {
        this.loading = false;
      }
    },

         async runOrdersTest() {
       this.loading = true;
       this.error = null;
       this.showTestDropdown = false; // Закрываем выпадающий список
       
       try {
         this.testResults = await PerformanceController.runPerformanceTest('orders_list');
       } catch (error) {
         this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
       } finally {
         this.loading = false;
       }
     },

           async runProjectsTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false; // Закрываем выпадающий список
        
        try {
          this.testResults = await PerformanceController.runPerformanceTest('projects_list');
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        } finally {
          this.loading = false;
        }
      },

      async runUsersTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false; // Закрываем выпадающий список
        
        try {
          this.testResults = await PerformanceController.runPerformanceTest('users_list');
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        } finally {
          this.loading = false;
        }
      },

      async runCommentsTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false; // Закрываем выпадающий список
        
        try {
          this.testResults = await PerformanceController.runPerformanceTest('comments_list');
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        } finally {
          this.loading = false;
        }
      },

      async runTimelineTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false; // Закрываем выпадающий список
        
        try {
          this.testResults = await PerformanceController.runPerformanceTest('timeline');
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        } finally {
          this.loading = false;
        }
      },

      async runCashRegistersTest() {
        this.loading = true;
        this.error = null;
        this.showTestDropdown = false; // Закрываем выпадающий список
        
        try {
          this.testResults = await PerformanceController.runPerformanceTest('cash_registers_list');
        } catch (error) {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        } finally {
          this.loading = false;
        }
      },

    toggleTestDropdown() {
      this.showTestDropdown = !this.showTestDropdown;
    },

    handleClickOutside(event) {
      // Закрываем выпадающий список при клике вне его
      const dropdown = event.target.closest('.relative');
      if (!dropdown) {
        this.showTestDropdown = false;
      }
    },

    async getCacheStats() {
      this.loading = true;
      this.error = null;
      
      try {
        const cacheStats = await PerformanceController.getCacheStats();
        // Обновляем метрики с информацией о кэше
        this.metrics = { ...this.metrics, ...cacheStats };
        this.showNotification('Статистика кэша обновлена', '', false);
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка загрузки статистики кэша', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
      } finally {
        this.loading = false;
      }
    },

    async clearCache() {
      this.loading = true;
      this.error = null;
      
      try {
        await PerformanceController.clearCache();
        // Обновляем метрики после очистки кэша
        await this.refreshMetrics();
        // Показываем уведомление об успешной очистке кэша
        this.showNotification('Кэш успешно очищен', '', false);
      } catch (error) {
        // Показываем уведомление об ошибке
        this.showNotification('Ошибка очистки кэша', error.response?.data?.message || error.message || 'Неизвестная ошибка', true);
        
        if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else if (error.response?.data?.error) {
          this.error = error.response.data.error;
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error = 'Неизвестная ошибка при очистке кэша';
        }
      } finally {
        this.loading = false;
      }
    },

         async refreshTableSizes() {
       this.loading = true;
       this.error = null;
       
       try {
         const tableSizes = await PerformanceController.getTableSizes();
         this.metrics = { ...this.metrics, table_sizes: tableSizes };
         this.showNotification('Размеры таблиц обновлены', '', false);
       } catch (error) {
         // Проверяем тип ошибки
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
     },

    async analyzeIndexes() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await PerformanceController.analyzeIndexes();
        this.performanceRecommendations = data;
        
        if (data.error) {
          this.showNotification('Анализ индексов недоступен', data.message, true);
        } else {
          this.showNotification('Анализ индексов завершен', '', false);
        }
      } catch (error) {
        // Проверяем тип ошибки и детали
        if (error.response?.status === 404) {
          this.error = 'API endpoint для анализа индексов не найден. Возможно, функция еще не реализована на сервере.';
        } else if (error.response?.status === 401) {
          this.error = 'Необходима авторизация для выполнения этой операции.';
        } else if (error.response?.status === 403) {
          this.error = 'Недостаточно прав для выполнения этой операции.';
        } else if (error.response?.status === 500) {
          // Анализируем детали ошибки сервера
          const errorData = error.response?.data;
          if (errorData?.error && errorData.error.includes('Column not found')) {
            this.error = 'Ошибка сервера: Неподдерживаемая версия MySQL или отсутствуют необходимые таблицы performance_schema. Функция анализа индексов недоступна.';
          } else if (errorData?.error) {
            this.error = `Ошибка сервера: ${errorData.error}`;
          } else {
            this.error = 'Ошибка сервера при анализе индексов. Возможно, функция еще не реализована или содержит ошибки.';
          }
        } else if (error.response?.status >= 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        }
        
        this.showNotification('Ошибка анализа индексов', this.error, true);
      } finally {
        this.loading = false;
      }
    },

    async getRealTimeMetrics() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await PerformanceController.getRealTimeMetrics();
        this.realTimeMetrics = data;
        this.showNotification('Метрики в реальном времени обновлены', '', false);
      } catch (error) {
        // Проверяем тип ошибки и детали
        if (error.response?.status === 404) {
          this.error = 'API endpoint для метрик в реальном времени не найден. Возможно, функция еще не реализована на сервере.';
        } else if (error.response?.status === 401) {
          this.error = 'Необходима авторизация для выполнения этой операции.';
        } else if (error.response?.status === 403) {
          this.error = 'Недостаточно прав для выполнения этой операции.';
        } else if (error.response?.status === 500) {
          // Анализируем детали ошибки сервера
          const errorData = error.response?.data;
          if (errorData?.error && errorData.error.includes('Column not found')) {
            this.error = 'Ошибка сервера: Неподдерживаемая версия MySQL или отсутствуют необходимые таблицы performance_schema. Функция метрик в реальном времени недоступна.';
          } else if (errorData?.error) {
            this.error = `Ошибка сервера: ${errorData.error}`;
          } else {
            this.error = 'Ошибка сервера при получении метрик в реальном времени. Возможно, функция еще не реализована или содержит ошибки.';
          }
        } else if (error.response?.status >= 500) {
          this.error = 'Ошибка сервера. Попробуйте позже.';
        } else {
          this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        }
        
        this.showNotification('Ошибка получения метрик', this.error, true);
      } finally {
        this.loading = false;
      }
    },

    async checkFeatureAvailability() {
      this.loading = true;
      this.error = null;
      
      try {
        const features = await PerformanceController.checkFeatureAvailability();
        this.featureAvailability = features;
        this.showNotification('Проверка доступности функций завершена', '', false);
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Неизвестная ошибка';
        this.showNotification('Ошибка проверки доступности функций', this.error, true);
      } finally {
        this.loading = false;
      }
    },

     // Методы для цветового кодирования результатов тестов
     getPerformanceClass(result) {
       const score = this.calculatePerformanceScore(result);
       if (score >= 80) return 'bg-green-100 text-green-800';
       if (score >= 60) return 'bg-yellow-100 text-yellow-800';
       return 'bg-red-100 text-red-800';
     },

     getPerformanceIcon(result) {
       const score = this.calculatePerformanceScore(result);
       if (score >= 80) return 'fa-check-circle';
       if (score >= 60) return 'fa-exclamation-triangle';
       return 'fa-times-circle';
     },

     getPerformanceText(result) {
       const score = this.calculatePerformanceScore(result);
       if (score >= 80) return 'Отличная производительность';
       if (score >= 60) return 'Средняя производительность';
       return 'Низкая производительность';
     },

     calculatePerformanceScore(result) {
       let score = 100;
       
       // Штраф за время выполнения (больше 100мс = плохо)
       if (result.execution_time_ms > 100) score -= 30;
       else if (result.execution_time_ms > 50) score -= 15;
       else if (result.execution_time_ms > 20) score -= 5;
       
       // Штраф за количество запросов (больше 5 = плохо)
       if (result.total_queries > 5) score -= 25;
       else if (result.total_queries > 3) score -= 15;
       else if (result.total_queries > 1) score -= 5;
       
       // Штраф за использование памяти (больше 1000КБ = плохо)
       if (result.memory_usage_kb > 1000) score -= 20;
       else if (result.memory_usage_kb > 500) score -= 10;
       
       return Math.max(0, score);
     },

     getMetricClass(result, metric) {
       const score = this.calculateMetricScore(result, metric);
       if (score >= 80) return 'bg-green-50';
       if (score >= 60) return 'bg-yellow-50';
       return 'bg-red-50';
     },

     getMetricTextClass(result, metric) {
       const score = this.calculateMetricScore(result, metric);
       if (score >= 80) return 'text-green-600';
       if (score >= 60) return 'text-yellow-600';
       return 'text-red-600';
     },

     getMetricValueClass(result, metric) {
       const score = this.calculateMetricScore(result, metric);
       if (score >= 80) return 'text-green-800';
       if (score >= 60) return 'text-yellow-800';
       return 'text-red-800';
     },

           calculateMetricScore(result, metric) {
        const value = result[metric];
        
        switch (metric) {
          case 'execution_time_ms':
            if (value <= 20) return 100;
            if (value <= 50) return 80;
            if (value <= 100) return 60;
            return 40;
            
          case 'total_queries':
            if (value <= 1) return 100;
            if (value <= 3) return 80;
            if (value <= 5) return 60;
            return 40;
            
          case 'memory_usage_kb':
            if (value <= 100) return 100;
            if (value <= 500) return 80;
            if (value <= 1000) return 60;
            return 40;
            
          default:
            return 80;
        }
      },

      // Метод для получения читаемых названий функций
      getFeatureDisplayName(feature) {
        const names = {
          basic_metrics: 'Основные метрики',
          table_sizes: 'Размеры таблиц',
          analyze_indexes: 'Анализ индексов',
          real_time_metrics: 'Метрики в реальном времени',
          cache_stats: 'Статистика кэша',
          performance_tests: 'Тесты производительности'
        };
        return names[feature] || feature;
      }


  }
};
</script>
