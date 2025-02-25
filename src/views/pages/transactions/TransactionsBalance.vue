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
                            }">{{ balance.value }}</span>
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

export default {
    props: {
        cashRegisterId: {
            type: Number,
            required: false,
            default: null
        }
    },
    data() {
        return {
            data: null,
            loading: false,
        };
    },
    created() {
        // this.fetchItems();
    },
    methods: {
        async fetchItems() {
            this.loading = true;
            try {
                if (this.cashRegisterId === null) {
                    const new_data = await CashRegisterController.getCashBalace();
                    this.data = new_data;
                }else{
                    const new_data = await CashRegisterController.getCashBalace([this.cashRegisterId]);
                    this.data = new_data;
                }
            } catch (e) {
                console.log("Ошибка получения баланса касс", e);
            }
            this.loading = false;
        }
    },
    watch: {
        cashRegisterId: {
            handler: function (val) {
                this.fetchItems();
            },
            immediate: true
        }
    }
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
