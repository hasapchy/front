/**
 * Утилита для тестирования работы store
 */

export default class StoreTester {
  constructor(store) {
    this.store = store;
  }

  /**
   * Тест загрузки данных с кэшированием
   */
  async testDataLoading() {
    console.log('=== ТЕСТ ЗАГРУЗКИ ДАННЫХ ===');
    
    const tests = [
      { name: 'Валюты', action: 'loadCurrencies', getter: 'currencies' },
      { name: 'Единицы измерения', action: 'loadUnits', getter: 'units' },
      { name: 'Статусы заказов', action: 'loadOrderStatuses', getter: 'orderStatuses' },
      { name: 'Статусы проектов', action: 'loadProjectStatuses', getter: 'projectStatuses' },
      { name: 'Категории транзакций', action: 'loadTransactionCategories', getter: 'transactionCategories' },
      { name: 'Статусы товаров', action: 'loadProductStatuses', getter: 'productStatuses' }
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Тестируем ${test.name} ---`);
        
        // Очищаем данные
        this.store.commit(`SET_${test.getter.toUpperCase()}`, []);
        
        // Загружаем данные
        const startTime = performance.now();
        await this.store.dispatch(test.action);
        const endTime = performance.now();
        
        const data = this.store.getters[test.getter];
        console.log(`✅ ${test.name}: загружено ${data.length} элементов за ${Math.round(endTime - startTime)}мс`);
        
        // Проверяем кэш
        const cacheKey = test.action.replace('load', '').toLowerCase() + '_cache';
        const cached = localStorage.getItem(cacheKey);
        console.log(`📦 Кэш ${test.name}: ${cached ? 'есть' : 'нет'}`);
        
      } catch (error) {
        console.error(`❌ Ошибка загрузки ${test.name}:`, error);
      }
    }
  }

  /**
   * Тест параллельной загрузки
   */
  async testParallelLoading() {
    console.log('\n=== ТЕСТ ПАРАЛЛЕЛЬНОЙ ЗАГРУЗКИ ===');
    
    const startTime = performance.now();
    
    try {
      await Promise.all([
        this.store.dispatch('loadCurrencies'),
        this.store.dispatch('loadUnits'),
        this.store.dispatch('loadOrderStatuses'),
        this.store.dispatch('loadProjectStatuses'),
        this.store.dispatch('loadTransactionCategories'),
        this.store.dispatch('loadProductStatuses')
      ]);
      
      const endTime = performance.now();
      console.log(`✅ Параллельная загрузка завершена за ${Math.round(endTime - startTime)}мс`);
      
    } catch (error) {
      console.error('❌ Ошибка параллельной загрузки:', error);
    }
  }

  /**
   * Тест повторной загрузки (должна быть из кэша)
   */
  async testCacheLoading() {
    console.log('\n=== ТЕСТ ЗАГРУЗКИ ИЗ КЭША ===');
    
    const tests = [
      { name: 'Валюты', action: 'loadCurrencies' },
      { name: 'Единицы измерения', action: 'loadUnits' },
      { name: 'Статусы заказов', action: 'loadOrderStatuses' }
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Повторная загрузка ${test.name} ---`);
        
        const startTime = performance.now();
        await this.store.dispatch(test.action);
        const endTime = performance.now();
        
        console.log(`⚡ ${test.name}: загружено за ${Math.round(endTime - startTime)}мс (должно быть быстро - из кэша)`);
        
      } catch (error) {
        console.error(`❌ Ошибка повторной загрузки ${test.name}:`, error);
      }
    }
  }

  /**
   * Тест состояния loading flags
   */
  testLoadingFlags() {
    console.log('\n=== ТЕСТ СОСТОЯНИЯ LOADING FLAGS ===');
    
    const flags = this.store.state.loadingFlags;
    const activeFlags = Object.entries(flags).filter(([key, value]) => value);
    
    if (activeFlags.length === 0) {
      console.log('✅ Все флаги загрузки неактивны');
    } else {
      console.log('⚠️ Активные флаги загрузки:', activeFlags.map(([key]) => key).join(', '));
    }
  }

  /**
   * Тест размера кэша
   */
  testCacheSize() {
    console.log('\n=== ТЕСТ РАЗМЕРА КЭША ===');
    
    let totalSize = 0;
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('_cache') || key.includes('_timestamp')
    );
    
    cacheKeys.forEach(key => {
      const size = localStorage.getItem(key).length;
      totalSize += size;
    });
    
    console.log(`📊 Количество кэшированных ключей: ${cacheKeys.length}`);
    console.log(`📊 Общий размер кэша: ${Math.round(totalSize / 1024 * 100) / 100}KB`);
    
    if (totalSize > 5 * 1024 * 1024) { // 5MB
      console.log('⚠️ Кэш превышает 5MB, рекомендуется очистка');
    } else {
      console.log('✅ Размер кэша в норме');
    }
  }

  /**
   * Запуск всех тестов
   */
  async runAllTests() {
    console.log('🚀 ЗАПУСК ТЕСТОВ STORE');
    console.log('='.repeat(50));
    
    await this.testDataLoading();
    await this.testParallelLoading();
    await this.testCacheLoading();
    this.testLoadingFlags();
    this.testCacheSize();
    
    console.log('\n🎉 ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ');
  }
}
