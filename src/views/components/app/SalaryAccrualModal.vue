<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">
            {{ getModalTitle() }}
        </h2>
        
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
                <select v-model="form.cash_id" required :disabled="!form.company_id || loading">
                    <option :value="null" disabled>{{ $t('selectCashRegister') || 'Выберите кассу' }}</option>
                    <option v-for="cash in cashRegisters" :key="cash.id" :value="cash.id">
                        {{ cash.name }} {{ cash.currencySymbol ? `(${cash.currencySymbol})` : '' }}
                    </option>
                </select>
            </div>

            <div v-if="operationType && operationType !== 'salaryAccrual'">
                <label class="required">{{ $t('amount') || 'Сумма' }}</label>
                <input 
                    type="number" 
                    v-model="form.amount" 
                    step="0.01"
                    min="0"
                    required
                    :disabled="loading"
                />
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
            @confirm="confirmOperation" 
            @leave="confirmDialog = false"
            :descr="confirmMessage"
            :confirm-text="getConfirmButtonText()"
            :leave-text="$t('cancel') || 'Отмена'" />
        <PrimaryButton 
            :onclick="handleCancel"
            :is-danger="true"
            icon="fas fa-times"
        >
        </PrimaryButton>
        <PrimaryButton 
            :onclick="handleOperation"
            :is-loading="loading"
            :is-success="true"
            :disabled="!isFormValid"
            icon="fas fa-save"
        >
        </PrimaryButton>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import CompaniesController from '@/api/CompaniesController';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionController from '@/api/TransactionController';
import ClientController from '@/api/ClientController';
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
            required: false,
            default: null
        },
        userIds: {
            type: Array,
            required: false,
            default: () => []
        },
        operationType: {
            type: String,
            required: false,
            default: 'salaryAccrual'
        }
    },
    emits: ['success', 'cancel'],
    data() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return {
            form: {
                company_id: null,
                date: today.toISOString().split('T')[0],
                cash_id: null,
                note: null,
                amount: null
            },
            loading: false,
            checking: false,
            cashRegisters: [],
            confirmDialog: false,
            confirmMessage: '',
            pendingAccrue: null,
            pendingOperation: null
        };
    },
    computed: {
        maxDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        },
        isFormValid() {
            if (!this.form.date || !this.form.cash_id || !this.form.company_id) {
                return false;
            }
            if (this.operationType && this.operationType !== 'salaryAccrual') {
                return this.form.amount && parseFloat(this.form.amount) > 0;
            }
            return true;
        }
    },
    async mounted() {
        if (!this.userIds || this.userIds.length === 0) {
            this.showNotification(
                this.$t('error') || 'Ошибка',
                this.$t('selectUsersFirst') || 'Выберите сотрудников для начисления зарплаты',
                true
            );
            this.$emit('cancel');
            return;
        }
        
        const companyId = this.companyId || this.$store.getters.currentCompanyId;
        
        if (!companyId) {
            this.showNotification(
                this.$t('error') || 'Ошибка',
                'Не выбрана компания. Пожалуйста, выберите компанию в настройках.',
                true
            );
            return;
        }
        
        this.form.company_id = companyId;
        await this.loadCashRegisters();
        
        if (this.operationType === 'salaryAccrual') {
            const month = new Date().toLocaleString('ru-RU', { month: 'long' });
            const year = new Date().getFullYear();
            this.form.note = `Зарплата за ${month} ${year}`;
        } else {
            this.form.note = this.getDefaultNote();
        }
    },
    methods: {
        async loadCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch (error) {
                console.error('Error loading cash registers:', error);
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    'Не удалось загрузить список касс',
                    true
                );
            }
        },
        async handleAccrue() {
            if (!this.form.company_id) {
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.$t('companyRequired') || 'Компания обязательна для выбора',
                    true
                );
                return;
            }

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
                const checkResult = await CompaniesController.checkExistingSalaries(this.form.company_id, this.form.date, this.userIds);
                
                console.log('Check result:', checkResult);
                
                if (checkResult && checkResult.has_existing === true && checkResult.affected_users && Array.isArray(checkResult.affected_users) && checkResult.affected_users.length > 0) {
                    const month = checkResult.month || new Date(this.form.date).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
                    const userNames = checkResult.affected_users
                        .map(u => u.user_name || `ID: ${u.user_id}`)
                        .filter(name => name);
                    
                    if (userNames.length > 0) {
                        const userList = userNames.map(name => `<li>${name}</li>`).join('');
                        this.confirmMessage = `Внимание! Начисление уже было ранее сделано в этом месяце (${month}) для следующих сотрудников:<ul style="margin: 10px 0; padding-left: 20px; list-style-type: disc; display: block;">${userList}</ul><br>Вы уверены, что хотите начислить им еще раз?`;
                    } else {
                        this.confirmMessage = `Внимание! Начисление уже было ранее сделано в этом месяце (${month}) для ${checkResult.affected_users.length} сотрудников.<br><br>Вы уверены, что хотите начислить им еще раз?`;
                    }
                    this.pendingAccrue = {
                        company_id: this.form.company_id,
                        date: this.form.date,
                        cash_id: this.form.cash_id,
                        note: this.form.note || null,
                        user_ids: this.userIds
                    };
                    this.confirmDialog = true;
                    this.checking = false;
                    return;
                }
                
                await this.performAccrue({
                    company_id: this.form.company_id,
                    date: this.form.date,
                    cash_id: this.form.cash_id,
                    note: this.form.note || null,
                    user_ids: this.userIds
                });
            } catch (error) {
                console.error('Error checking existing accruals:', error);
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.getApiErrorMessage(error) || 'Ошибка при проверке существующих начислений',
                    true
                );
            } finally {
                this.checking = false;
            }
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
                const result = await CompaniesController.accrueSalaries(this.form.company_id, payload);

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
                this.$emit('cancel');
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
        },
        getConfirmButtonText() {
            return this.$t('save') || 'Сохранить';
        },
        async handleOperation() {
            if (!this.isFormValid) {
                return;
            }

            if (this.operationType === 'salaryAccrual') {
                await this.handleAccrue();
                return;
            }

            await this.performBatchTransaction();
        },
        async performBatchTransaction() {
            if (!this.form.company_id || !this.form.date || !this.form.cash_id) {
                return;
            }

            if (this.operationType !== 'salaryAccrual' && (!this.form.amount || parseFloat(this.form.amount) <= 0)) {
                this.showNotification(
                    this.$t('error') || 'Ошибка',
                    this.$t('amountRequired') || 'Укажите сумму',
                    true
                );
                return;
            }

            this.loading = true;
            try {
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                const cashRegister = this.cashRegisters.find(c => c.id === this.form.cash_id);
                
                if (!cashRegister) {
                    throw new Error('Касса не найдена');
                }

                const results = {
                    success: 0,
                    errors: 0,
                    errorMessages: []
                };

                const processBatch = async (batch) => {
                    return Promise.all(batch.map(async (userId) => {
                        try {
                            const client = clients.find(c => {
                                const clientEmployeeId = c.employeeId ? Number(c.employeeId) : null;
                                return clientEmployeeId === Number(userId);
                            });

                            if (!client) {
                                return {
                                    success: false,
                                    error: `Клиент для сотрудника ID ${userId} не найден`
                                };
                            }

                            const transactionData = this.buildTransactionData(client, cashRegister);
                            
                            if (!transactionData.orig_amount || transactionData.orig_amount <= 0) {
                                return {
                                    success: false,
                                    error: `Сотрудник ID ${userId}: Не указана сумма`
                                };
                            }
                            
                            await TransactionController.storeItem(transactionData);
                            return { success: true };
                        } catch (error) {
                            console.error(`Ошибка при создании транзакции для сотрудника ${userId}:`, error);
                            const errorMsg = this.getApiErrorMessage(error);
                            return {
                                success: false,
                                error: `Сотрудник ID ${userId}: ${errorMsg}`
                            };
                        }
                    }));
                };

                const batchSize = 5;
                const transactionResults = [];
                
                for (let i = 0; i < this.userIds.length; i += batchSize) {
                    const batch = this.userIds.slice(i, i + batchSize);
                    const batchResults = await processBatch(batch);
                    transactionResults.push(...batchResults);
                }
                
                transactionResults.forEach(result => {
                    if (result.success) {
                        results.success++;
                    } else {
                        results.errors++;
                        results.errorMessages.push(result.error);
                    }
                });

                let message = `Выполнено: ${results.success}`;
                if (results.errors > 0) {
                    message += `, Ошибок: ${results.errors}`;
                    if (results.errorMessages.length > 0) {
                        const errorDetails = results.errorMessages.slice(0, 5).join('; ');
                        const moreErrors = results.errorMessages.length > 5 ? ` и еще ${results.errorMessages.length - 5}...` : '';
                        message += `\n\n${errorDetails}${moreErrors}`;
                    }
                }

                this.showNotification(
                    results.errors > 0 ? (this.$t('error') || 'Ошибка') : (this.$t('success') || 'Успешно'),
                    message,
                    results.errors > 0
                );

                if (results.errors > 0 && results.errorMessages.length > 0) {
                    console.error('Ошибки при выполнении операции:', results.errorMessages);
                }

                this.$emit('success', results);
                this.$emit('cancel');
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
        buildTransactionData(client, cashRegister) {
            const categoryIds = {
                'salaryPayment': 7,
                'bonus': 26,
                'penalty': 27,
                'advance': 23
            };

            const isDebt = {
                'salaryPayment': false,
                'bonus': true,
                'penalty': true,
                'advance': false
            };

            const transactionType = {
                'salaryPayment': 0,
                'bonus': 0,
                'penalty': 1,
                'advance': 0
            };

            return {
                type: transactionType[this.operationType],
                client_id: client.id,
                cash_id: this.form.cash_id,
                category_id: categoryIds[this.operationType],
                date: this.form.date,
                orig_amount: parseFloat(this.form.amount),
                currency_id: cashRegister.currencyId || cashRegister.currency_id,
                note: this.form.note || this.getDefaultNote(),
                is_debt: isDebt[this.operationType],
                project_id: null
            };
        },
        getDefaultNote() {
            const notes = {
                'salaryPayment': 'Выплата зарплаты',
                'bonus': 'Премия',
                'penalty': 'Штраф',
                'advance': 'Аванс'
            };
            return notes[this.operationType] || '';
        },
        getModalTitle() {
            const titles = {
                'salaryAccrual': this.$t('accrueSalariesForSelected') || `Начислить зарплаты выбранным сотрудникам (${this.userIds?.length || 0})`,
                'salaryPayment': this.$t('paySalariesForSelected') || `Выплатить зарплаты выбранным сотрудникам (${this.userIds?.length || 0})`,
                'bonus': this.$t('accrueBonusesForSelected') || `Начислить премии выбранным сотрудникам (${this.userIds?.length || 0})`,
                'penalty': this.$t('issuePenaltiesForSelected') || `Выписать штрафы выбранным сотрудникам (${this.userIds?.length || 0})`,
                'advance': this.$t('issueAdvancesForSelected') || `Выдать авансы выбранным сотрудникам (${this.userIds?.length || 0})`
            };
            return titles[this.operationType] || titles['salaryAccrual'];
        },
        async confirmOperation() {
            this.confirmDialog = false;
            if (this.pendingOperation) {
                const operation = this.pendingOperation;
                this.pendingOperation = null;
                this.form.amount = operation.amount;
                await this.performBatchTransaction();
            }
        }
    }
};
</script>

