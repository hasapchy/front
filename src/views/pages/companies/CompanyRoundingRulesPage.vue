<template>
    <div class="flex flex-col h-full">
        <div class="flex-1 overflow-auto p-4">
            <h2 class="text-lg font-bold mb-4">{{ $t('roundingRules') }}</h2>
            
            <!-- Загрузка -->
            <div v-if="loading" class="flex justify-center items-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
            </div>

            <!-- Формы настроек по контекстам -->
            <div v-else class="space-y-6">
                <!-- Заказы -->
                <RoundingRuleSection 
                    :context="contexts.orders" 
                    :label="$t('roundingForOrders')"
                    :rule="rules[contexts.orders]"
                    :decimals="ruleData[contexts.orders].decimals"
                    :direction="ruleData[contexts.orders].direction"
                    :customThreshold="ruleData[contexts.orders].customThreshold"
                    @update:decimals="ruleData[contexts.orders].decimals = $event"
                    @update:direction="ruleData[contexts.orders].direction = $event"
                    @update:customThreshold="ruleData[contexts.orders].customThreshold = $event"
                />

                <!-- Оприходования -->
                <RoundingRuleSection 
                    :context="contexts.receipts" 
                    :label="$t('roundingForReceipts')"
                    :rule="rules[contexts.receipts]"
                    :decimals="ruleData[contexts.receipts].decimals"
                    :direction="ruleData[contexts.receipts].direction"
                    :customThreshold="ruleData[contexts.receipts].customThreshold"
                    @update:decimals="ruleData[contexts.receipts].decimals = $event"
                    @update:direction="ruleData[contexts.receipts].direction = $event"
                    @update:customThreshold="ruleData[contexts.receipts].customThreshold = $event"
                />

                <!-- Продажи -->
                <RoundingRuleSection 
                    :context="contexts.sales" 
                    :label="$t('roundingForSales')"
                    :rule="rules[contexts.sales]"
                    :decimals="ruleData[contexts.sales].decimals"
                    :direction="ruleData[contexts.sales].direction"
                    :customThreshold="ruleData[contexts.sales].customThreshold"
                    @update:decimals="ruleData[contexts.sales].decimals = $event"
                    @update:direction="ruleData[contexts.sales].direction = $event"
                    @update:customThreshold="ruleData[contexts.sales].customThreshold = $event"
                />

                <!-- Транзакции -->
                <RoundingRuleSection 
                    :context="contexts.transactions" 
                    :label="$t('roundingForTransactions')"
                    :rule="rules[contexts.transactions]"
                    :decimals="ruleData[contexts.transactions].decimals"
                    :direction="ruleData[contexts.transactions].direction"
                    :customThreshold="ruleData[contexts.transactions].customThreshold"
                    @update:decimals="ruleData[contexts.transactions].decimals = $event"
                    @update:direction="ruleData[contexts.transactions].direction = $event"
                    @update:customThreshold="ruleData[contexts.transactions].customThreshold = $event"
                />
            </div>
        </div>

        <!-- Кнопки сохранения -->
        <div class="mt-auto p-4 flex space-x-2 bg-[#edf4fb]">
            <PrimaryButton 
                icon="fas fa-save" 
                :onclick="saveAllRules" 
                :is-loading="saveLoading"
            >
                {{ $t('save') }}
            </PrimaryButton>
        </div>

        <!-- Уведомления -->
        <NotificationToast 
            :title="notificationTitle" 
            :subtitle="notificationSubtitle" 
            :show="notification" 
            :is-danger="notificationIsDanger" 
            @close="closeNotification" 
        />
    </div>
</template>

<script>
import CompanyRoundingRulesController from '@/api/CompanyRoundingRulesController';
import CompanyRoundingRuleDto from '@/dto/CompanyRoundingRuleDto';
import RoundingRuleSection from './RoundingRuleSection.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin],
    components: { RoundingRuleSection, PrimaryButton, NotificationToast },
    data() {
        return {
            loading: true,
            saveLoading: false,
            rules: {}, // загруженные правила { context: CompanyRoundingRuleDto }
            contexts: CompanyRoundingRuleDto.contexts,
            directions: CompanyRoundingRuleDto.directions,
            ruleData: {
                [CompanyRoundingRuleDto.contexts.orders]: { decimals: 2, direction: 'standard', customThreshold: 0.5 },
                [CompanyRoundingRuleDto.contexts.receipts]: { decimals: 2, direction: 'standard', customThreshold: 0.5 },
                [CompanyRoundingRuleDto.contexts.sales]: { decimals: 2, direction: 'standard', customThreshold: 0.5 },
                [CompanyRoundingRuleDto.contexts.transactions]: { decimals: 2, direction: 'standard', customThreshold: 0.5 },
            }
        };
    },
    mounted() {
        this.loadRules();
    },
    methods: {
        async loadRules() {
            this.loading = true;
            try {
                const items = await CompanyRoundingRulesController.getItems();
                const rulesMap = {};
                
                // Преобразуем массив в объект по контекстам
                items.forEach(item => {
                    rulesMap[item.context] = new CompanyRoundingRuleDto(item);
                });
                
                this.rules = rulesMap;
                
                // Загружаем существующие значения в форму
                Object.keys(this.contexts).forEach(ctxKey => {
                    const ctx = this.contexts[ctxKey];
                    if (this.rules[ctx]) {
                        this.ruleData[ctx] = {
                            decimals: this.rules[ctx].decimals,
                            direction: this.rules[ctx].direction,
                            customThreshold: this.rules[ctx].custom_threshold || 0.5
                        };
                    }
                });
            } catch (error) {
                console.error('Ошибка загрузки правил округления:', error);
                this.showNotification(
                    this.$t('errorLoadingRoundingRules'), 
                    error.message || 'Unknown error', 
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        async saveAllRules() {
            this.saveLoading = true;
            try {
                const promises = Object.keys(this.contexts).map(ctxKey => {
                    const context = this.contexts[ctxKey];
                    const data = this.ruleData[context];
                    
                    const payload = {
                        context: context,
                        decimals: parseInt(data.decimals),
                        direction: data.direction,
                        custom_threshold: data.direction === this.directions.custom 
                            ? parseFloat(data.customThreshold) 
                            : null
                    };
                    
                    return CompanyRoundingRulesController.upsertItem(payload);
                });
                
                await Promise.all(promises);
                
                this.showNotification(
                    this.$t('roundingRulesSaved'), 
                    this.$t('roundingRulesSavedSuccess'), 
                    false
                );
                
                // Перезагружаем правила
                await this.loadRules();
            } catch (error) {
                console.error('Ошибка сохранения правил округления:', error);
                this.showNotification(
                    this.$t('errorSavingRoundingRules'), 
                    error.response?.data?.errors || error.message, 
                    true
                );
            } finally {
                this.saveLoading = false;
            }
        }
    }
};
</script>

