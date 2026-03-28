<template>
  <div class="work-schedule-editor">
    <div class="mb-4 p-4 bg-white border rounded">
      <h3 class="text-md font-semibold mb-3">
        {{ $t('workSchedule') }}
      </h3>
            
      <!-- Кнопка быстрой настройки -->
      <div class="mb-4 flex gap-2">
        <button 
          class="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          @click="applyToAll"
        >
          {{ $t('applyToAllDays') }}
        </button>
        <button 
          class="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          @click="resetToDefault"
        >
          {{ $t('resetToDefault') }}
        </button>
      </div>

      <!-- Таблица с днями недели -->
      <div class="overflow-x-auto">
        <table
          class="min-w-full bg-white shadow-sm rounded"
          style="font-size: 12px;"
        >
          <thead class="bg-gray-100 rounded-t-sm">
            <tr>
              <th class="text-left border border-gray-300 py-2 px-3 font-medium">
                {{ $t('day') }}
              </th>
              <th class="text-center border border-gray-300 py-2 px-3 font-medium">
                {{ $t('working') }}
              </th>
              <th class="text-left border border-gray-300 py-2 px-3 font-medium">
                {{ $t('startTime') }}
              </th>
              <th class="text-left border border-gray-300 py-2 px-3 font-medium">
                {{ $t('endTime') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(day, dayKey) in schedule" 
              :key="dayKey"
              class="hover:bg-gray-50 transition-colors border-b border-gray-300"
            >
              <td class="py-2 px-3 border-x border-gray-300 font-medium">
                {{ getDayName(dayKey) }}
              </td>
              <td class="py-2 px-3 border-x border-gray-300 text-center">
                <input 
                  v-model="schedule[dayKey].enabled" 
                  type="checkbox"
                  class="cursor-pointer"
                >
              </td>
              <td class="py-2 px-3 border-x border-gray-300">
                <input 
                  v-model="schedule[dayKey].start" 
                  type="time"
                  :disabled="!schedule[dayKey].enabled"
                  class="w-full px-2 py-1 border rounded"
                  :class="{ 'bg-gray-100 cursor-not-allowed': !schedule[dayKey].enabled }"
                >
              </td>
              <td class="py-2 px-3 border-x border-gray-300">
                <input 
                  v-model="schedule[dayKey].end" 
                  type="time"
                  :disabled="!schedule[dayKey].enabled"
                  class="w-full px-2 py-1 border rounded"
                  :class="{ 'bg-gray-100 cursor-not-allowed': !schedule[dayKey].enabled }"
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
    name: 'WorkScheduleEditor',
    props: {
        modelValue: {
            type: Object,
            default: () => null
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            schedule: this.getDefaultSchedule(),
            isUpdatingFromProp: false // Флаг для предотвращения рекурсии
        };
    },
    watch: {
        modelValue: {
            immediate: true,
            handler(newValue) {
                // Предотвращаем обновление, если мы сами эмитили изменение
                if (this.isUpdatingFromProp) {
                    return;
                }
                
                if (newValue && this.isValidSchedule(newValue)) {
                    // Проверяем, действительно ли значение изменилось
                    if (!this.isScheduleEqual(this.schedule, newValue)) {
                        this.schedule = this.deepClone(newValue);
                    }
                } else {
                    const defaultSchedule = this.getDefaultSchedule();
                    if (!this.isScheduleEqual(this.schedule, defaultSchedule)) {
                        this.schedule = defaultSchedule;
                    }
                }
            }
        },
        schedule: {
            deep: true,
            handler(newSchedule) {
                // Предотвращаем рекурсию
                if (this.isUpdatingFromProp) {
                    return;
                }
                
                // Эмитим только если значение действительно изменилось
                if (!this.isScheduleEqual(newSchedule, this.modelValue)) {
                    this.isUpdatingFromProp = true;
                    this.$nextTick(() => {
                        this.$emit('update:modelValue', this.deepClone(newSchedule));
                        this.$nextTick(() => {
                            this.isUpdatingFromProp = false;
                        });
                    });
                }
            }
        }
    },
    methods: {
        /**
         * Получить дефолтный график
         */
        getDefaultSchedule() {
            return {
                1: { enabled: true, start: '10:00', end: '19:00' },
                2: { enabled: true, start: '10:00', end: '19:00' },
                3: { enabled: true, start: '10:00', end: '19:00' },
                4: { enabled: true, start: '10:00', end: '19:00' },
                5: { enabled: true, start: '10:00', end: '19:00' },
                6: { enabled: true, start: '10:00', end: '14:00' },
                7: { enabled: false, start: '00:00', end: '00:00' }
            };
        },
        
        /**
         * Проверить валидность графика
         */
        isValidSchedule(schedule) {
            if (!schedule) return false;
            const requiredDays = [1, 2, 3, 4, 5, 6, 7];
            return requiredDays.every(day => 
                schedule[day] && 
                [true, false].includes(schedule[day].enabled) &&
                schedule[day].start?.trim?.() !== undefined &&
                schedule[day].end?.trim?.() !== undefined
            );
        },
        
        /**
         * Сравнить два графика на равенство
         */
        isScheduleEqual(schedule1, schedule2) {
            if (!schedule1 || !schedule2) return schedule1 === schedule2;
            
            const days = [1, 2, 3, 4, 5, 6, 7];
            return days.every(day => {
                const day1 = schedule1[day];
                const day2 = schedule2[day];
                if (!day1 || !day2) return day1 === day2;
                return day1.enabled === day2.enabled && 
                       day1.start === day2.start && 
                       day1.end === day2.end;
            });
        },
        
        /**
         * Глубокое клонирование объекта
         */
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        /**
         * Получить название дня недели
         */
        getDayName(dayKey) {
            const days = {
                1: this.$t('1'),
                2: this.$t('2'),
                3: this.$t('3'),
                4: this.$t('4'),
                5: this.$t('5'),
                6: this.$t('6'),
                7: this.$t('7')
            };
            return days[dayKey] || dayKey;
        },
        
        /**
         * Применить настройки ко всем дням
         */
        applyToAll() {
            // Используем настройки понедельника как образец
            const template = { ...this.schedule[1] };
            Object.keys(this.schedule).forEach(day => {
                this.schedule[day] = { ...template };
            });
        },
        
        /**
         * Сбросить к дефолтным значениям
         */
        resetToDefault() {
            this.schedule = this.getDefaultSchedule();
        }
    }
};
</script>

<style scoped>
.work-schedule-editor {
    width: 100%;
}

input[type="time"]:disabled {
    opacity: 0.6;
}
</style>