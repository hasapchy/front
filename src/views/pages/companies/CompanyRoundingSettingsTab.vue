<template>
    <div>
        <h3 class="text-md font-semibold mb-4">{{ $t('roundingRules') }}</h3>

        <!-- Загрузка -->
        <div v-if="loading" class="flex justify-center items-center py-8">
            <SpinnerIcon size-class="text-2xl" additional-class="text-gray-400" />
        </div>

        <!-- Формы настроек по контекстам -->
        <div v-else class="space-y-6">
            <RoundingRuleSection v-for="contextConfig in contextsConfig" :key="contextConfig.key"
                :context="contextConfig.context" :label="contextConfig.label" :rule="rules[contextConfig.context]"
                :decimals="ruleData[contextConfig.context].decimals"
                :direction="ruleData[contextConfig.context].direction"
                :customThreshold="ruleData[contextConfig.context].customThreshold"
                @update:decimals="updateRuleData(contextConfig.context, 'decimals', $event)"
                @update:direction="updateRuleData(contextConfig.context, 'direction', $event)"
                @update:customThreshold="updateRuleData(contextConfig.context, 'customThreshold', $event)" />
        </div>

        <!-- Уведомления -->
        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
    </div>
</template>

<script>
import CompanyRoundingRulesController from '@/api/CompanyRoundingRulesController';
import CompanyRoundingRuleDto from '@/dto/CompanyRoundingRuleDto';
import RoundingRuleSection from './RoundingRuleSection.vue';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin],
    components: { RoundingRuleSection, NotificationToast },
    props: {
        companyId: {
            type: [Number, String],
            required: true
        }
    },
    data() {
        return {
            loading: true,
            rules: {},
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
    computed: {
        contextsConfig() {
            return [
                { key: 'orders', context: this.contexts.orders, label: this.$t('roundingForOrders') },
                { key: 'receipts', context: this.contexts.receipts, label: this.$t('roundingForReceipts') },
                { key: 'sales', context: this.contexts.sales, label: this.$t('roundingForSales') },
                { key: 'transactions', context: this.contexts.transactions, label: this.$t('roundingForTransactions') }
            ];
        }
    },
    mounted() {
        this.loadRules();
    },
    methods: {
        updateRuleData(context, field, value) {
            this.ruleData[context][field] = value;
        },
        async loadRules() {
            this.loading = true;
            try {
                const items = await CompanyRoundingRulesController.getItems();
                const rulesMap = {};
                
                const rules = CompanyRoundingRuleDto.fromApiArray(items);
                rules.forEach(rule => {
                    rulesMap[rule.context] = rule;
                });

                this.rules = rulesMap;

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

                    return CompanyRoundingRulesController.storeItem(payload);
                });

                await Promise.all(promises);

                await this.loadRules();
            } catch (error) {
                console.error('Ошибка сохранения правил округления:', error);
                throw error;
            }
        }
    }
};
</script>
