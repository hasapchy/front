<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                <div v-for="item in data" :key="item.id" class="bg-white p-2 rounded-lg shadow-md">
                    <span class="text-md font-semibold mb-4">{{ item.name }}</span>
                    <div class="grid grid-cols-3 gap-4">
                        <div v-for="balance in item.balance" :key="balance.title" class="flex flex-col justify-between">
                            <span class="text-sm font-medium">{{ balance.title }}</span>
                            <span :class="{
                                'text-[#5CB85C]': balance.type === 'income',
                                'text-[#EE4F47]': balance.type === 'outcome',
                                'text-[#337AB7]': balance.type === 'default',
                                'font-semibold text-lg': true
                            }">{{ Number(balance.value).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-20">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
</template>
<script>
import CashRegisterController from '@/api/CashRegisterController';
import dayjs from 'dayjs';

export default {
    props: {
        cashRegisterId: { type: Number, default: null },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        dateFilter: { type: String, default: 'all_time' }
    },
    data() {
        return {
            data: null,
            loading: false,
        };
    },
    created() {
        this.fetchItems();
    },
    methods: {
        async fetchItems() {
            this.loading = true;
            try {
                // 1. Вычисляем реальные start/end в зависимости от dateFilter
                let start = null, end = null;
                switch (this.dateFilter) {
                    case 'today':
                        start = end = dayjs().format('DD.MM.YYYY');
                        break;
                    case 'yesterday':
                        start = end = dayjs().subtract(1, 'day').format('DD.MM.YYYY');
                        break;
                    case 'this_week':
                        start = dayjs().startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'last_week':
                        start = dayjs().subtract(1, 'week').startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().subtract(1, 'week').endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'this_month':
                        start = dayjs().startOf('month').format('DD.MM.YYYY');
                        end = dayjs().endOf('month').format('DD.MM.YYYY');
                        break;
                    case 'last_month':
                        start = dayjs().subtract(1, 'month').startOf('month').format('DD.MM.YYYY');
                        end = dayjs().subtract(1, 'month').endOf('month').format('DD.MM.YYYY');
                        break;
                    case 'custom':
                        start = this.startDate ? dayjs(this.startDate).format('DD.MM.YYYY') : null;
                        end = this.endDate ? dayjs(this.endDate).format('DD.MM.YYYY') : null;
                        break;
                    case 'all_time':
                    default:
                    // оставляем start/end = null
                }

                // 2. Формируем cashIds
                const cashIds = this.cashRegisterId !== null ? [this.cashRegisterId] : [];

                // 3. Запрашиваем баланс с нужным диапазоном
                this.data = await CashRegisterController.getCashBalance(
                    cashIds,
                    start,
                    end
                );
            } finally {
                this.loading = false;
            }
        }
    },
    watch: {
        cashRegisterId: 'fetchItems',
        dateFilter: 'fetchItems',
        startDate: 'fetchItems',
        endDate: 'fetchItems',
    },
}
</script>
<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>
