<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Проект</h2>


        <div>
            <label>Название</label>
            <input type="text" v-model="name">
        </div>
        <div>
            <label>Бюджет проекта</label>
            <input type="number" v-model="budget">
        </div>
        <div>
            <label>Дата проекта</label>
            <input type="datetime-local" v-model="dateModel" />
        </div>
        <!-- Начало блока поиска клиентов -->

        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1">Поиск клиента</label>
            <input type="text" v-model="clientSearch" placeholder="Введите имя или номер клиента"
                class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="showDropdown = false">
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="clientSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                    <!-- <li v-else-if="clientSearch.length === 0" class="p-2 text-gray-500">Ожидание запроса...</li> -->
                    <template v-else-if="clientSearch.length === 0">
                        <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                    <li v-for="client in clientResults" :key="client.id"
                        @mousedown.prevent="() => { selectClient(client) }"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                        </div>
                        <span :class="client.balance > 0 ? 'text-green-500' : 'text-red-500'">
                            {{ client.balanceFormatted() }}
                            <!-- {{ client.currencySymbol }} -->
                            <span v-if="client.balanceNumeric() > 0">(Клиент должен нам)</span>
                            <span v-else-if="client.balanceNumeric() < 0">(Мы должны клиенту)</span>
                            <span v-else>(0)</span>
                        </span>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class="">
            <div class="p-2 pt-0 mt-2 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label>Клиент</label>
                        <p><span class="font-semibold text-sm">Имя:</span> {{ selectedClient.fullName() }}</p>
                        <p><span class="font-semibold text-sm">Номер:</span> {{ selectedClient.phones[0].phone }}
                        </p>
                        <p><span class="font-semibold text-sm">Баланс:</span>
                            <span :class="selectedClient.balanceNumeric() > 0 ? 'text-green-500' : 'text-red-500'">
                                {{ selectedClient.balanceFormatted() }}
                                <!-- {{ selectedClient.currencySymbol }} -->
                                <span v-if="selectedClient.balanceNumeric() > 0">(Клиент должен нам)</span>
                                <span v-else-if="selectedClient.balanceNumeric() < 0">(Мы должны клиенту)</span>
                                <span v-else>(0)</span>
                            </span>
                        </p>
                        <!-- <p><strong>Баланс:</strong>
                        <span
                        class="{{ optional($selectedClient->balance)->balance > 0 ? 'text-green-500' : 'text-red-500' }}">
                        {{ number_format((optional($selectedClient->balance)->balance ?? 0) * $conversionRate, 2) }}
                        {{ $conversionService->getSelectedCurrency($sessionCurrencyCode)->symbol }}
                        @if (optional($selectedClient->balance)->balance > 0)
                                (Клиент должен нам)
                            @elseif(optional($selectedClient->balance)->balance < 0)
                            (Мы должны клиенту)
                            @else
                            (0)
                            @endif
                        </span>
                    </p> -->
                    </div>
                    <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer">&times;</button>
                </div>
            </div>
        </div>

        <!-- Конец блока поиска клиентов -->
        <div class="mt-4">
            <label>Назначить пользователей</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <label v-for="user, index in users" :key="user.id"
                    class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                    <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                    <span class="text-black">{{ user.name }}</span>
                </label>
            </div>
        </div>
        <div class="mt-4">
            <label>Файлы</label>
            <input type="file" multiple @change="handleFileChange" />
            <ul>
                <li v-for="(file, index) in files" :key="index" class="flex items-center space-x-2">
                    <a :href="editingItem.getFileUrl(file)" :download="file.name" target="_blank"
                        class="text-blue-600 hover:underline">
                        {{ file.name || file.path }}
                    </a>
                    <button @click="showDeleteFileDialog(index)"
                        class="text-red-500 hover:text-red-700">Удалить</button>
                </li>
            </ul>
        </div>
    </div>




    <!-- {{ editingItem.id }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории'" :confirm-text="'Удалить категорию'" :leave-text="'Отмена'" />
    <AlertDialog :dialog="deleteFileDialog" @confirm="confirmDeleteFile" @leave="closeDeleteFileDialog"
        :descr="`Подтвердите удаление файла '${files[deleteFileIndex]?.name || 'без имени'}'`"
        :confirm-text="'Удалить файл'" :leave-text="'Отмена'" />
</template>


<script>
import UsersController from '@/api/UsersController';
import ClientController from '@/api/ClientController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProjectDto from '@/dto/project/ProjectDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import debounce from 'lodash.debounce';
import ProjectController from '@/api/ProjectController';
import api from '@/api/axiosInstance';


export default {
    components: {
        PrimaryButton,
        AlertDialog,
        TabBar
    },
    props: {
        editingItem: {
            type: ProjectDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            budget: this.editingItem ? this.editingItem.budget : 0,
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            dateObj: this.editingItem ? new Date(this.editingItem.date) : new Date(),
            selectedUsers: this.editingItem ? this.editingItem.users.map(user => user.id.toString()) : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            users: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            // Поиск клиентов
            clientSearch: '',
            clientSearchLoading: false,
            clientResults: [],
            lastClients: [],
            showDropdown: false,

            files: this.editingItem?.files || [],
            uploading: false,
            deleteFileDialog: false,
            deleteFileIndex: -1,
        }
    },
    computed: {
        dateModel: {
            get() {
                const d = new Date(this.dateObj);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                return d.toISOString().slice(0, 16);
            },
            set(val) {
                this.dateObj = new Date(val);
            }
        }
    },
    created() {
        this.fetchUsers();
        this.fetchLastClients();
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();
        },
        async fetchLastClients() {
            const paginated = await ClientController.getItems(1);
            this.lastClients = paginated.items.slice(0, 10);
        },
        // Поиск клиентов
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 4) {
                this.clientSearchLoading = true;
                const results = await ClientController.search(this.clientSearch);
                this.clientSearchLoading = false;
                this.clientResults = results;
            } else {
                this.clientResults = [];
            }
        }, 250),
        selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
        },
        deselectClient() {
            this.selectedClient = null;
        },
        async save() {
            if (this.uploading) {
                alert('Дождитесь завершения загрузки файлов');
                return;
            }
            this.saveLoading = true;
            try {
                let resp;
                const payload = {
                    name: this.name,
                    budget: this.budget,
                    date: this.dateObj.toISOString(),
                    client_id: this.selectedClient.id,
                    users: this.selectedUsers,
                };

                if (this.editingItemId != null) {
                    resp = await ProjectController.updateItem(this.editingItemId, payload);
                } else {
                    resp = await ProjectController.storeItem(payload);
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', error);
            }
            this.saveLoading = false;
        },
        async deleteItem() {
        },
        clearForm() {
            this.name = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.budget = 0;
            this.selectedClient = null;
            this.selectedUsers = [];
            this.editingItemId = null;
            this.fetchUsers();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        async handleFileChange(event) {
            if (!this.editingItemId) {
                alert('Сначала сохраните проект, затем прикрепляйте файлы');
                event.target.value = '';
                return;
            }
            const files = event.target.files;
            if (!files.length) return;

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }

            this.uploading = true;
            try {
                const response = await api.post(`/projects/${this.editingItemId}/upload-files`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                this.files = response.data.files;
                event.target.value = '';
            } catch (e) {
                alert('Ошибка загрузки файлов');
            }
            this.uploading = false;
        },
        showDeleteFileDialog(index) {
            this.deleteFileIndex = index; // Сохраняем индекс файла
            this.deleteFileDialog = true; // Показываем диалог
        },
        closeDeleteFileDialog() {
            this.deleteFileDialog = false;
            this.deleteFileIndex = -1; // Сбрасываем индекс
        },
        async confirmDeleteFile() {
            if (this.deleteFileIndex === -1 || !this.editingItemId) {
                this.closeDeleteFileDialog();
                return;
            }

            const file = this.files[this.deleteFileIndex];
            if (!file) {
                this.closeDeleteFileDialog();
                return;
            }

            try {
                const response = await api.post(`/projects/${this.editingItemId}/delete-file`, {
                    path: file.path
                });
                this.files = response.data.files; // Обновляем список файлов
            } catch (e) {
                alert('Ошибка удаления файла');
            }

            this.closeDeleteFileDialog(); // Закрываем диалог
        },
        async deleteFile(index) {
            if (!this.editingItemId) return;
            const file = this.files[index];
            if (!file) return;

            try {
                const response = await api.post(`/projects/${this.editingItemId}/delete-file`, {
                    path: file.path
                });
                this.files = response.data.files;
            } catch (e) {
                alert('Ошибка удаления файла');
            }
        },
    },
    watch: {
        // Поиск клиентов
        clientSearch: {
            handler: 'searchClients',
            immediate: true
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.budget = newEditingItem.budget || 0;
                    this.date = newEditingItem.date || '';
                    this.selectedClient = newEditingItem.client || null;
                    this.selectedUsers = Array.isArray(newEditingItem.users)
                        ? newEditingItem.users
                        : [];
                    this.editingItemId = newEditingItem.id || null;
                    this.files = newEditingItem.files || [];
                } else {
                    this.name = '';
                    this.date = '';
                    this.budget = 0;
                    this.selectedClient = null;
                    this.selectedUsers = [];
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>

<!-- Стили для поиска клиентов: -->
<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>