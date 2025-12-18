<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ $t('accrueSalariesForCompany') || 'Начислить зарплаты сотрудникам компании' }}</h2>
        
        <div class="space-y-4 flex-1">
            <div>
                <label class="required">{{ $t('date') || 'Дата начисления' }}</label>
                <input 
                    type="date" 
                    v-model="form.date" 
                    :max="maxDate"
                    required
                />
            </div>

            <div>
                <label class="required">{{ $t('cashRegister') || 'Касса' }}</label>
                <select v-model="form.cash_id" required>
                    <option :value="null" disabled>{{ $t('selectCashRegister') || 'Выберите кассу' }}</option>
                    <option v-for="cash in cashRegisters" :key="cash.id" :value="cash.id">
                        {{ cash.name }} {{ cash.currencySymbol ? `(${cash.currencySymbol})` : '' }}
                    </option>
                </select>
            </div>

            <div>
                <label>{{ $t('note') || 'Примечание' }}</label>
                <textarea 
                    v-model="form.note" 
                    :placeholder="$t('salaryAccrualNotePlaceholder') || 'Зарплата за ...'"
                    rows="3"
                    class="w-full"
                    maxlength="255"
                ></textarea>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <AlertDialog 
            :dialog="confirmDialog" 
            @confirm="confirmAccrue" 
            @leave="confirmDialog = false"
            :descr="confirmMessage"
            :confirm-text="$t('accrue') || 'Начислить'"
            :leave-text="$t('cancel') || 'Отмена'" />
        <PrimaryButton 
            :onclick="handleCancel"
            :is-danger="true"
            icon="fas fa-times"
        >
        </PrimaryButton>
        <PrimaryButton 
            :onclick="handleAccrue"
            :is-loading="loading"
            :is-success="true"
            :disabled="!form.date || !form.cash_id"
            icon="fas fa-money-bill-wave"
        >
        </PrimaryButton>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import CompaniesController from '@/api/CompaniesController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        PrimaryButton,
        AlertDialog
    },
    props: {
        companyId: {
            type: Number,
            required: true
        }
    },
    emits: ['success', 'cancel'],
    data() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            form: {
                date: today.toISOString().split('T')[0],
                cash_id: null,
                note: null
            },
            loading: false,
            checking: false,
            cashRegisters: [],
            confirmDialog: false,
            confirmMessage: '',
            pendingAccrue: null
        };
    },
    computed: {
        maxDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        }
    },
    async mounted() {
        await this.loadCashRegisters();
        const month = new Date().toLocaleString('ru-RU', { month: 'long' });
        const year = new Date().getFullYear();
        this.form.note = `Зарплата за ${month} ${year}`;
    },
    methods: {
        async loadCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch (error) {
                console.error('Error loading cash registers:', error);
            }
        },
        async handleAccrue() {
            if (!this.form.date) {
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.$t('dateRequired') || 'Дата обязательна для заполнения',
                    true
                );
                return;
            }

            if (!this.form.cash_id) {
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.$t('cashRegisterRequired') || 'Касса обязательна для выбора',
                    true
                );
                return;
            }

            this.checking = true;
            try {
                const checkResult = await CompaniesController.checkExistingSalaries(this.companyId, this.form.date);
                
                if (checkResult.has_existing) {
                    const month = checkResult.month || new Date(this.form.date).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
                    this.confirmMessage = this.$t('salaryAccrualAlreadyExists') || 
                        `Начисление уже было ранее сделано в этом месяце (${month}). Было начислено ${checkResult.employees_count} сотрудникам в ${checkResult.count} операциях. Вы уверены, что хотите продолжить?`;
                    this.pendingAccrue = {
                        date: this.form.date,
                        cash_id: this.form.cash_id,
                        note: this.form.note || null
                    };
                    this.confirmDialog = true;
                    this.checking = false;
                    return;
                }
            } catch (error) {
                console.error('Error checking existing accruals:', error);
            } finally {
                this.checking = false;
            }

            await this.performAccrue({
                date: this.form.date,
                cash_id: this.form.cash_id,
                note: this.form.note || null
            });
        },
        async confirmAccrue() {
            this.confirmDialog = false;
            if (this.pendingAccrue) {
                await this.performAccrue(this.pendingAccrue);
                this.pendingAccrue = null;
            }
        },
        async performAccrue(payload) {
            this.loading = true;
            try {
                const result = await CompaniesController.accrueSalaries(this.companyId, payload);

                const successCount = result.summary?.success || 0;
                const skippedCount = result.summary?.skipped || 0;
                const errorCount = result.summary?.errors || 0;

                let message = `Начислено: ${successCount}`;
                if (skippedCount > 0) {
                    message += `, Пропущено: ${skippedCount}`;
                }
                if (errorCount > 0) {
                    message += `, Ошибок: ${errorCount}`;
                }

                this.showNotification(
                    this.$t('success') || 'Успешно',
                    message,
                    false
                );

                this.$emit('success', result);
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    errorMessage,
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        handleCancel() {
            this.$emit('cancel');
        }
    }
};
</script>

