<template>
  <div>
    <!-- Производительность продаж -->
    <div v-if="metrics.sales_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов продаж</h2>
        
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

    <!-- Производительность клиентов -->
    <div v-if="metrics.clients_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов клиентов</h2>
        
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

    <!-- Производительность продуктов -->
    <div v-if="metrics.products_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность запросов продуктов</h2>
        
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

    <!-- Производительность комментариев и таймлайна -->
    <div v-if="metrics.comments_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность комментариев и таймлайна</h2>
        
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
    </div>

    <!-- Производительность касс -->
    <div v-if="metrics.cash_registers_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность касс</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

    <!-- Производительность инвойсов -->
    <div v-if="metrics.invoices_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность инвойсов</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список инвойсов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.invoices_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.invoices_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.invoices_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.invoices_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск инвойсов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.invoices_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.invoices_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.invoices_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.invoices_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Производительность складов -->
    <div v-if="metrics.warehouses_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность складов</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список складов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouses_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouses_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouses_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouses_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск складов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouses_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouses_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouses_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouses_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Производительность оприходований -->
    <div v-if="metrics.warehouse_receipts_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность оприходований</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список оприходований</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_receipts_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_receipts_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_receipts_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_receipts_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск оприходований</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_receipts_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_receipts_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_receipts_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_receipts_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Производительность списаний -->
    <div v-if="metrics.warehouse_writeoffs_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность списаний</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список списаний</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_writeoffs_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_writeoffs_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_writeoffs_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_writeoffs_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск списаний</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_writeoffs_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_writeoffs_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_writeoffs_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_writeoffs_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Производительность трансферов -->
    <div v-if="metrics.warehouse_transfers_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность трансферов</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список трансферов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_transfers_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_transfers_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_transfers_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.warehouse_transfers_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск трансферов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_transfers_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_transfers_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_transfers_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.warehouse_transfers_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Производительность заказов -->
    <div v-if="metrics.orders_performance" class="mb-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Производительность заказов</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Список заказов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Время выполнения</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.orders_performance.list_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Использование памяти</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.orders_performance.list_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Количество запросов</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.orders_performance.list_performance?.total_queries }}</div>
              </div>
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-sm text-blue-600">Записей на странице</div>
                <div class="text-xl font-bold text-blue-800">{{ metrics.orders_performance.list_performance?.items_count }}</div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h4 class="text-md font-medium text-gray-700 mb-3">Поиск заказов</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Время выполнения</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.orders_performance.search_performance?.execution_time }} мс</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Использование памяти</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.orders_performance.search_performance?.memory_usage }} КБ</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Количество запросов</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.orders_performance.search_performance?.total_queries }}</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-sm text-green-600">Записей найдено</div>
                <div class="text-xl font-bold text-green-800">{{ metrics.orders_performance.search_performance?.items_count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'PerformanceMetricsComponent',
  props: {
    metrics: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
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
      
      if (result.execution_time_ms > 100) score -= 30;
      else if (result.execution_time_ms > 50) score -= 15;
      else if (result.execution_time_ms > 20) score -= 5;
      
      if (result.total_queries > 5) score -= 25;
      else if (result.total_queries > 3) score -= 15;
      else if (result.total_queries > 1) score -= 5;
      
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
    }
  }
};
</script>
