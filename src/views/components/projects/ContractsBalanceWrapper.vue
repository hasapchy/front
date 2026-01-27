<template>
    <div class="flex gap-4 mb-4">
        <div class="flex-1">
            <transition name="fade" mode="out-in">
                <div v-if="data != null && !loading && data.length > 0" key="table">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                        <div class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">{{ $t('paid') }}</span>
                            </div>
                            <div class="text-center">
                                <div class="text-[#5CB85C] font-bold text-sm leading-tight">
                                    <div class="balance-amount">{{ paidTotalDisplay }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">{{ $t('notPaid') }}</span>
                            </div>
                            <div class="text-center">
                                <div class="text-[#EE4F47] font-bold text-sm leading-tight">
                                    <div class="balance-amount">{{ unpaidTotalDisplay }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">{{ $t('total') }}</span>
                            </div>
                            <div class="text-center">
                                <div class="text-blue-600 font-bold text-sm leading-tight">
                                    <div class="balance-amount">{{ totalDisplay }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="loading" key="loader" class="flex justify-center items-center h-20">
                    <SpinnerIcon />
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';

export default {
    name: 'ContractsBalanceWrapper',
    components: {
        SpinnerIcon
    },
    props: {
        data: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        contractTotals() {
            const paid = {};
            const unpaid = {};
            const total = {};

            for (const contract of this.data || []) {
                const currencySymbol = contract.currencySymbol || 'Нет валюты';
                const amount = parseFloat(contract.amount || 0);

                if (Number.isNaN(amount)) {
                    continue;
                }

                total[currencySymbol] = (total[currencySymbol] || 0) + amount;
                if (contract.isPaid) {
                    paid[currencySymbol] = (paid[currencySymbol] || 0) + amount;
                } else {
                    unpaid[currencySymbol] = (unpaid[currencySymbol] || 0) + amount;
                }
            }

            return { paid, unpaid, total };
        },
        paidTotalDisplay() {
            return this.formatTotals(this.contractTotals.paid);
        },
        unpaidTotalDisplay() {
            return this.formatTotals(this.contractTotals.unpaid);
        },
        totalDisplay() {
            return this.formatTotals(this.contractTotals.total);
        }
    },
    methods: {
        formatTotals(totalsByCurrency) {
            const result = Object.entries(totalsByCurrency || {})
                .map(([currencySymbol, amount]) => `${this.$formatNumber(amount || 0, null, true)} ${currencySymbol}`.trim())
                .join(' / ');

            return result || '0';
        }
    }
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
