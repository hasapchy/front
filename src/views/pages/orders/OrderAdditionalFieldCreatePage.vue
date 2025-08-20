<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editAdditionalField') : $t('createAdditionalField') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-show="currentTab === 'info'">
                <div>
                    <label class="required">{{ $t('fieldName') }}</label>
                    <input type="text" v-model="name" required :disabled="!!editingItemId" class="w-full border rounded p-2">
                </div>
                <div>
                    <label class="required">{{ $t('fieldType') }}</label>
                    <select v-model="type" required :disabled="!!editingItemId" class="w-full border rounded p-2">
                        <option value="">{{ $t('selectType') }}</option>
                        <option v-for="typeOption in translatedFieldTypes" :key="typeOption.value" :value="typeOption.value">
                            {{ typeOption.label }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="required">{{ $t('categories') }}</label>
                    <div class="flex flex-wrap gap-2">
                        <label v-for="category in allCategories" :key="category.id" class="flex items-center space-x-2">
                            <input type="checkbox" :value="category.id" v-model="categoryIds" :disabled="!!editingItemId">
                            <span>{{ category.name }}</span>
                        </label>
                    </div>
                </div>
                <div v-if="type === 'select'">
                    <label class="required">{{ $t('options') }}</label>
                    <div class="space-y-2">
                        <div v-for="(option, index) in options" :key="index" class="flex items-center space-x-2">
                            <input type="text" v-model="options[index]" :placeholder="$t('optionPlaceholder')" class="flex-1 border rounded p-2">
                            <PrimaryButton icon="fas fa-trash" :onclick="() => removeOption(index)" :is-danger="true" :is-small="true" />
                        </div>
                        <PrimaryButton icon="fas fa-plus" :onclick="addOption" :is-info="true" :is-small="true">
                            {{ $t('addOption') }}
                        </PrimaryButton>
                    </div>
                </div>
                <div>
                    <label>{{ $t('required') }}</label>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" v-model="required" :disabled="!!editingItemId">
                        <span>{{ $t('fieldRequired') }}</span>
                    </div>
                </div>
                <div v-if="type !== 'boolean'">
                    <label>{{ $t('defaultValue') }}</label>
                    <input v-if="type === 'date' || type === 'datetime'" :type="type === 'date' ? 'date' : 'datetime-local'" v-model="defaultValue" :disabled="!!editingItemId" class="w-full border rounded p-2">
                    <input v-else-if="type === 'int'" type="number" v-model="defaultValue" :disabled="!!editingItemId" class="w-full border rounded p-2">
                    <input v-else type="text" v-model="defaultValue" :disabled="!!editingItemId" class="w-full border rounded p-2">
                </div>
            </div>
            <div v-show="currentTab === 'preview'">
                <div class="p-4 ">
                    <h3 class="font-bold mb-2">{{ $t('fieldPreview') }}</h3>
                    <div class="space-y-2">
                        <label class="block" :class="{ 'required': required }">
                            {{ name || $t('fieldName') }}
                        </label>
                        <div v-if="type === 'select'">
                            <select class="w-full border rounded p-2" :value="displayDefaultValue">
                                <option value="">{{ $t('selectOption') }}</option>
                                <option v-for="option in options" :key="option" :value="option" :selected="option === displayDefaultValue">{{ option }}</option>
                            </select>
                        </div>
                        <div v-else-if="type === 'date'">
                            <input type="date" class="w-full border rounded p-2" :value="displayDefaultValue">
                        </div>
                        <div v-else-if="type === 'datetime'">
                            <input type="datetime-local" class="w-full border rounded p-2" :value="displayDefaultValue">
                        </div>
                        <div v-else-if="type === 'int'">
                            <input type="number" class="w-full border rounded p-2" :value="displayDefaultValue">
                        </div>
                        <div v-else-if="type === 'boolean'">
                            <input type="checkbox" :checked="displayDefaultValue">
                        </div>
                        <div v-else>
                            <input type="text" class="w-full border rounded p-2" :value="displayDefaultValue">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <!-- Кнопки -->
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItemId" icon="fas fa-check" :onclick="saveWithoutClose" :is-loading="saveLoading">
                {{ $t('save') }}
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
                {{ $t('save') }}
            </PrimaryButton>
            <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-remove">
                {{ $t('delete') }}
            </PrimaryButton>
        </div>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import OrderAfController from '@/api/OrderAfController';
import OrderCategoryController from '@/api/OrderCategoryController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'fieldInfo' },
                { name: 'preview', label: 'preview' }
            ],
            name: '',
            type: '',
            categoryIds: [],
            options: [],
            required: false,
            defaultValue: '',
            editingItemId: null,
            allCategories: [],
            fieldTypes: [
                { value: 'string', label: 'text' },
                { value: 'int', label: 'number' },
                { value: 'date', label: 'date' },
                { value: 'datetime', label: 'datetime' },
                { value: 'boolean', label: 'boolean' },
                { value: 'select', label: 'select' }
            ],
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
        };
    },
    created() {
        this.fetchAllCategories();
        this.loadEditingData();
    },
    // Убираем watch для пользователя, так как он больше не нужен
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    watch: {
        editingItem: {
            handler(newVal) {
                if (newVal) {
                    this.loadEditingData();
                } else {
                    // Сброс данных при закрытии формы
                    this.resetForm();
                }
            },
            immediate: true
        }
    },
    computed: {
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        translatedFieldTypes() {
            return this.fieldTypes.map(type => ({
                ...type,
                label: this.$t(type.label)
            }));
        },
        
        displayDefaultValue() {
            if (this.type === 'boolean') {
                return this.defaultValue === 'true' || this.defaultValue === true;
            }
            return this.defaultValue;
        }
    },
    methods: {
        loadEditingData() {
            if (this.editingItem) {
                this.name = this.editingItem.name || '';
                this.type = this.editingItem.type || '';
                this.categoryIds = this.editingItem.category_ids || this.editingItem.categoryIds || [];
                this.options = this.editingItem.options || [];
                this.required = this.editingItem.required || false;
                this.defaultValue = this.editingItem.default_value || this.editingItem.defaultValue || '';
                this.editingItemId = this.editingItem.id || null;
            }
        },

        resetForm() {
            this.name = '';
            this.type = '';
            this.categoryIds = [];
            this.options = [];
            this.required = false;
            this.defaultValue = '';
            this.editingItemId = null;
            this.currentTab = 'info';
        },

        changeTab(tab) {
            this.currentTab = tab;
        },

        addOption() {
            this.options.push('');
        },

        removeOption(index) {
            this.options.splice(index, 1);
        },

        async fetchAllCategories() {
            try {
                this.allCategories = await OrderCategoryController.getAllItems();
            } catch (error) {
                console.error('Ошибка при получении категорий:', error);
                // В случае ошибки устанавливаем пустой массив
                this.allCategories = [];
            }
        },

        async save() {
            if (!this.validateForm()) return;
            
            this.saveLoading = true;
            try {
                const data = OrderAfController.prepareFieldData({
                    name: this.name,
                    type: this.type,
                    category_ids: this.categoryIds,
                    options: this.type === 'select' ? this.options.filter(opt => opt.trim()) : null,
                    required: this.required,
                    default: this.defaultValue
                });

                if (this.editingItemId) {
                    await OrderAfController.updateItem(this.editingItemId, data);
                } else {
                    await OrderAfController.createItem(data);
                }

                this.$emit('saved');
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.$emit('saved-error', errors.join('\n'));
            } finally {
                this.saveLoading = false;
            }
        },

        async saveWithoutClose() {
            if (!this.validateForm()) return;
            
            this.saveLoading = true;
            try {
                const data = OrderAfController.prepareFieldData({
                    name: this.name,
                    type: this.type,
                    category_ids: this.categoryIds,
                    options: this.type === 'select' ? this.options.filter(opt => opt.trim()) : null,
                    required: this.required,
                    default: this.defaultValue
                });

                if (this.editingItemId) {
                    await OrderAfController.updateItem(this.editingItemId, data);
                } else {
                    await OrderAfController.createItem(data);
                }

                this.$emit('saved-silent');
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.$emit('saved-error', errors.join('\n'));
            } finally {
                this.saveLoading = false;
            }
        },

        validateForm() {
            if (!this.name.trim()) {
                this.$emit('saved-error', this.$t('fieldNameRequired'));
                return false;
            }
            if (!this.type) {
                this.$emit('saved-error', this.$t('fieldTypeRequired'));
                return false;
            }
            if (this.categoryIds.length === 0) {
                this.$emit('saved-error', this.$t('categoriesRequired'));
                return false;
            }
            if (this.type === 'select' && this.options.filter(opt => opt.trim()).length === 0) {
                this.$emit('saved-error', this.$t('selectOptionsRequired'));
                return false;
            }
            return true;
        },

        async deleteItem() {
            this.deleteLoading = true;
            try {
                await OrderAfController.deleteItem(this.editingItemId);
                this.$emit('deleted');
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.$emit('deleted-error', errors.join('\n'));
            } finally {
                this.deleteLoading = false;
                this.closeDeleteDialog();
            }
        },

        showDeleteDialog() {
            this.deleteDialog = true;
        },

        closeDeleteDialog() {
            this.deleteDialog = false;
        },

        handleCloseRequest() {
            if (this.checkForChanges()) {
                this.closeConfirmDialog = true;
            } else {
                this.$emit('close-request');
            }
        },

        confirmClose() {
            this.closeConfirmDialog = false;
            this.$emit('close-request');
        },

        cancelClose() {
            this.closeConfirmDialog = false;
        },

        // Переопределяем метод getFormState из миксина
        getFormState() {
            return {
                name: this.name,
                type: this.type,
                categoryIds: this.categoryIds,
                options: this.options,
                required: this.required,
                defaultValue: this.defaultValue
            };
        }
    }
};
</script>
