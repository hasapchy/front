<template>
    <div>
        <div class="flex flex-col overflow-auto h-full p-4">
            <h2 class="text-lg font-bold mb-4">
                {{ getModalTitle() }}
            </h2>

            <div class="space-y-4 flex-1">
                <div>
                    <label class="required">{{ $t('date') }}</label>
                    <input type="datetime-local" v-model="form.date" :max="maxDate" required />
                </div>

                <div>
                    <label class="required">{{ $t('cashRegister') }}</label>
                    <select v-model="form.cash_id" required :disabled="!form.company_id || loading">
                        <option :value="null" disabled>{{ $t('selectCashRegister') }}</option>
                        <option v-for="cash in cashRegisters" :key="cash.id" :value="cash.id">
                            {{ cash.name }} {{ cash.currencySymbol ? `(${cash.currencySymbol})` : '' }}
                        </option>
                    </select>
                </div>

                <div v-if="operationType === 'salaryAccrual' || operationType === 'salaryPayment'">
                    <label class="required">{{ $t('salaryPaymentType') }}</label>
                    <select v-model.number="form.payment_type" required>
                        <option :value="0">{{ $t('salaryPaymentTypeNonCash') }}</option>
                        <option :value="1">{{ $t('salaryPaymentTypeCash') }}</option>
                    </select>
                </div>

                <div v-if="operationType && operationType !== 'salaryAccrual' && operationType !== 'salaryPayment'">
                    <label class="required">{{ $t('amount') }}</label>
                    <input type="number" v-model="form.amount" step="0.01" min="0" required :disabled="loading" />
                </div>

                <div>
                    <label>{{ $t('note') }}</label>
                    <textarea v-model="form.note" :placeholder="$t('salaryAccrualNotePlaceholder')"
                        rows="3" class="w-full" maxlength="255"></textarea>
                </div>
            </div>
        </div>
        <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
            <AlertDialog :dialog="confirmDialog" @confirm="confirmOperation" @leave="confirmDialog = false"
                :descr="confirmMessage" :confirm-text="getConfirmButtonText()" :leave-text="$t('cancel')" />
            <PrimaryButton :onclick="handleCancel" :is-danger="true" icon="fas fa-times" :aria-label="$t('close')">
            </PrimaryButton>
            <PrimaryButton :onclick="handleOperation" :is-loading="loading" :is-success="true" :disabled="!isFormValid"
                icon="fas fa-save">
            </PrimaryButton>
        </div>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import CompaniesController from '@/api/CompaniesController';
import TransactionController from '@/api/TransactionController';
import UsersController from '@/api/UsersController';
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
        users: {
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
        return {
            form: {
                company_id: null,
                date: today.toISOString().substring(0, 16),
                cash_id: null,
                note: null,
                amount: null,
                payment_type: 1
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
            return today.toISOString().substring(0, 16);
        },
        isFormValid() {
            if (!this.form.date || !this.form.cash_id || !this.form.company_id) {
                return false;
            }
            if ((this.operationType === 'salaryAccrual' || this.operationType === 'salaryPayment') && (this.form.payment_type !== 0 && this.form.payment_type !== 1)) {
                return false;
            }
            if (this.operationType !== 'salaryAccrual' && this.operationType !== 'salaryPayment') {
                return this.form.amount && parseFloat(this.form.amount) > 0;
            }
            if (this.operationType === 'salaryPayment') {
                return true;
            }
            return true;
        }
    },
    async mounted() {
        if (!this.userIds || this.userIds.length === 0) {
            this.showNotification(
                this.$t('error'),
                this.$t('selectUsersFirst'),
                true
            );
            this.$emit('cancel');
            return;
        }

        const companyId = this.companyId || this.$store.getters.currentCompanyId;

        if (!companyId) {
            this.showNotification(
                this.$t('error'),
                this.$t('companyNotSelected'),
                true
            );
            return;
        }

        this.form.company_id = companyId;
        await this.loadCashRegisters();

        if (this.operationType === 'salaryPayment') {
            await this.loadUserSalaries();
        }

        if (this.operationType === 'salaryAccrual') {
            const locale = this.$i18n?.locale || undefined;
            const month = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date());
            const year = new Date().getFullYear();
            this.form.note = this.$t('salaryAccrualDefaultNote', { month, year });
        } else {
            this.form.note = this.getDefaultNote();
        }
    },
    methods: {
        getLocale() {
            return this.$i18n?.locale || undefined;
        },
        async loadCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch (error) {
                console.error('Error loading cash registers:', error);
                this.showNotification(
                    this.$t('error'),
                    this.$t('errorLoadingCashRegisters'),
                    true
                );
            }
        },
        async loadUserSalaries() {
            for (const user of this.users) {
                const data = await UsersController.getSalaries(user.id);
                this.$set(user, 'salaries', data.salaries || []);
            }
        },
        async handleAccrue() {
            this.checking = true;
            try {
                const checkResult = await CompaniesController.checkExistingSalaries(this.form.company_id, this.form.date, this.userIds);

                if (checkResult?.has_existing && checkResult.affected_users?.length > 0) {
                    const month = checkResult.month || new Intl.DateTimeFormat(this.getLocale(), { month: 'long', year: 'numeric' }).format(new Date(this.form.date));
                    const userNames = checkResult.affected_users
                        .map(u => u.user_name || `ID: ${u.user_id}`)
                        .filter(name => name);

                    if (userNames.length > 0) {
                        const userList = userNames.map(name => `<li>${name}</li>`).join('');
                        this.confirmMessage = `${this.$t('salaryAccrualAlreadyExistsInMonth', { month })}<ul style="margin: 10px 0; padding-left: 20px; list-style-type: disc; display: block;">${userList}</ul><br>${this.$t('salaryAccrualConfirmRepeat')}`;
                    } else {
                        this.confirmMessage = `${this.$t('salaryAccrualAlreadyExistsInMonthForCount', { month, count: checkResult.affected_users.length })}<br><br>${this.$t('salaryAccrualConfirmRepeat')}`;
                    }
                    this.pendingAccrue = {
                        company_id: this.form.company_id,
                        date: this.form.date,
                        cash_id: this.form.cash_id,
                        note: this.form.note || null,
                        user_ids: this.userIds,
                        payment_type: this.form.payment_type
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
                    user_ids: this.userIds,
                    payment_type: this.form.payment_type
                });
            } catch (error) {
                console.error('Error checking existing accruals:', error);
                this.showNotification(
                    this.$t('error'),
                    this.getApiErrorMessage(error) || this.$t('errorCheckingExistingAccruals'),
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

                let message = `${this.$t('accrued')}: ${successCount}`;
                if (skippedCount > 0) {
                    message += `, ${this.$t('skipped')}: ${skippedCount}`;
                }
                if (errorCount > 0) {
                    message += `, ${this.$t('errors')}: ${errorCount}`;
                }

                this.showNotification(
                    this.$t('success'),
                    message,
                    false
                );

                this.$emit('success', result);
                this.$emit('cancel');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'),
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
            return this.$t('save');
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
            this.loading = true;
            try {
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                const cashRegister = this.cashRegisters.find(c => c.id === this.form.cash_id);

                if (!cashRegister) {
                    throw new Error(this.$t('cashRegisterNotFound'));
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
                                    error: this.$t('employeeClientNotFoundForId', { id: userId })
                                };
                            }

                            const transactionData = this.buildTransactionData(client, cashRegister, userId);
                            await TransactionController.storeItem(transactionData);
                            return { success: true };
                        } catch (error) {
                            console.error(`Ошибка при создании транзакции для сотрудника ${userId}:`, error);
                            const errorMsg = this.getApiErrorMessage(error);
                            return {
                                success: false,
                                error: this.$t('employeeErrorForId', { id: userId, error: errorMsg })
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

                let message = `${this.$t('completed')}: ${results.success}`;
                if (results.errors > 0) {
                    message += `, ${this.$t('errors')}: ${results.errors}`;
                    if (results.errorMessages.length > 0) {
                        const errorDetails = results.errorMessages.slice(0, 5).join('; ');
                        const moreErrors = results.errorMessages.length > 5 ? ` ${this.$t('andMoreErrors', { count: results.errorMessages.length - 5 })}` : '';
                        message += `\n\n${errorDetails}${moreErrors}`;
                    }
                }

                this.showNotification(
                    results.errors > 0 ? this.$t('error') : this.$t('success'),
                    message,
                    results.errors > 0
                );

                if (results.errors > 0 && results.errorMessages.length > 0) {
                    console.error('Errors during operation:', results.errorMessages);
                }

                this.$emit('success', results);
                this.$emit('cancel');
            } catch (error) {
                const errorMessage = this.getApiErrorMessage(error);
                this.showNotification(
                    this.$t('error'),
                    errorMessage,
                    true
                );
            } finally {
                this.loading = false;
            }
        },
        buildTransactionData(client, cashRegister, userId = null) {
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

            let amount = parseFloat(this.form.amount);

            if (this.operationType === 'salaryPayment' && userId) {
                const user = this.users.find(u => u.id === userId);
                const salary = user?.salaries?.find(s => Number(s.payment_type) === Number(this.form.payment_type) && !s.end_date);
                if (salary?.amount) {
                    amount = parseFloat(salary.amount);
                }
            }

            return {
                type: transactionType[this.operationType],
                client_id: client.id,
                cash_id: this.form.cash_id,
                category_id: categoryIds[this.operationType],
                date: this.form.date,
                orig_amount: amount,
                currency_id: cashRegister.currencyId || cashRegister.currency_id,
                note: this.form.note || this.getDefaultNote(),
                is_debt: isDebt[this.operationType],
                project_id: null
            };
        },
        getDefaultNote() {
            const notes = {
                'salaryPayment': this.$t('paySalary'),
                'bonus': this.$t('bonus'),
                'penalty': this.$t('penalty'),
                'advance': this.$t('advance')
            };
            return notes[this.operationType] || '';
        },
        getModalTitle() {
            const count = this.userIds?.length || 0;
            const titles = {
                salaryAccrual: this.$t('accrueSalariesForSelected'),
                salaryPayment: this.$t('paySalariesForSelected'),
                bonus: this.$t('accrueBonusesForSelected'),
                penalty: this.$t('issuePenaltiesForSelected'),
                advance: this.$t('issueAdvancesForSelected'),
            };
            const title = titles[this.operationType] || titles.salaryAccrual;
            return `${title} (${count})`;
        },
        async confirmOperation() {
            this.confirmDialog = false;
            if (this.pendingAccrue) {
                await this.confirmAccrue();
            }
        }
    }
};
</script>
