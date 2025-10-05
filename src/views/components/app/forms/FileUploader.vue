<template>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ singleImage ? $t('image') : $t('files') }}
        </label>
        
        <!-- Режим одиночного изображения -->
        <div v-if="singleImage" class="flex items-start space-x-4">
            <!-- Превью изображения (показывается только если есть изображение) -->
            <div v-if="currentImage || selectedImage" class="relative p-3 bg-gray-100 rounded">
                <img :src="currentImage || selectedImage" alt="Selected Image" class="w-32 h-32 object-cover rounded">
                <button @click="removeImage" 
                        class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        :title="$t('removeImage')">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            
            <!-- Кнопка загрузки (показывается всегда) -->
            <div 
                class="border-2 border-dashed rounded-lg p-4 transition-colors duration-200 w-48"
                :class="{
                    'border-blue-400 bg-blue-50': isDragOver,
                    'border-gray-300': !isDragOver
                }"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
            >
                <input
                    type="file"
                    @change="handleFileChange"
                    :disabled="isUploading"
                    class="hidden"
                    ref="fileInput"
                    accept=".jpg,.jpeg,.png,.gif,.webp"
                />
                <button
                    type="button"
                    @click="$refs.fileInput.click()"
                    :disabled="isUploading"
                    class="w-full text-center py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i class="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                    <p v-if="!isDragOver" class="text-sm">{{ $t('clickToUploadImage') }}</p>
                    <p v-else class="text-blue-600 font-medium text-sm">{{ $t('dropImageToUpload') }}</p>
                </button>
            </div>
        </div>
        
        <!-- Обычный режим множественных файлов -->
        <div v-else
            class="border-2 border-dashed rounded-lg p-4 transition-colors duration-200"
            :class="{
                'border-blue-400 bg-blue-50': isDragOver,
                'border-gray-300': !isDragOver
            }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
        >
            <input
                type="file"
                multiple
                @change="handleFileChange"
                :disabled="isUploading"
                class="hidden"
                ref="fileInput"
                :accept="acceptedFileTypes"
            />
            <button
                type="button"
                @click="$refs.fileInput.click()"
                :disabled="isUploading"
                class="w-full text-center py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i class="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                <p v-if="!isDragOver">{{ $t('clickToUploadFiles') }}</p>
                <p v-else class="text-blue-600 font-medium">{{ $t('dropFilesToUpload') }}</p>
            </button>
        </div>
        
        <!-- Прогресс загрузки отдельных файлов -->
        <div v-if="uploadingFiles.length > 0" class="mt-4 space-y-2">
            <div v-for="uploadFile in uploadingFiles" :key="uploadFile.id" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i :class="getFileInfo(uploadFile.name).icon" class="text-blue-600"></i>
                        <span class="text-blue-700 font-medium text-sm">{{ uploadFile.name }}</span>
                        <span class="text-blue-600 text-xs">({{ formatFileSize(uploadFile.size) }})</span>
                    </div>
                    <span class="text-blue-600 text-sm font-medium">{{ uploadFile.progress }}%</span>
                </div>
                <div class="w-full bg-blue-200 rounded-full h-2">
                    <div 
                        class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        :style="{width: uploadFile.progress + '%'}"
                    ></div>
                </div>
                <div v-if="uploadFile.error" class="mt-2 text-red-600 text-sm">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    {{ uploadFile.error }}
                </div>
            </div>
        </div>
        
        <!-- Таблица файлов -->
        <div v-if="files && files.length > 0" class="mt-4">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-600">{{ $t('totalFiles') }}: {{ files.length }}</span>
                <div class="flex gap-2">
                    <PrimaryButton 
                        :onclick="toggleAllFiles" 
                        :is-info="!allFilesSelected"
                        :is-light="allFilesSelected"
                        :icon="allFilesSelected ? 'fas fa-times' : 'fas fa-check-double'"
                        class="text-xs py-1 px-2"
                        :title="allFilesSelected ? $t('clearSelection') : $t('selectAll')">
                    </PrimaryButton>
                    <PrimaryButton 
                        v-if="selectedFileIds.length > 0"
                        icon="fas fa-trash" 
                        :onclick="() => $emit('delete-multiple-files', selectedFileIds)" 
                        :is-danger="true"
                        :disabled="deleting || isUploading"
                        class="text-xs py-1 px-2"
                        :title="$t('deleteSelected')">
                    </PrimaryButton>
                </div>
            </div>
            
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium w-8">
                            <input 
                                type="checkbox" 
                                :checked="selectedFileIds.length === files.length && files.length > 0"
                                :indeterminate="selectedFileIds.length > 0 && selectedFileIds.length < files.length"
                                @change="toggleAllFilesCheckbox"
                                class="rounded border-gray-300"
                            />
                        </th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileName') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileSize') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileType') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="file in files" :key="file.path" class="hover:bg-gray-50">
                        <td class="border border-gray-300 px-3 py-2 text-center">
                            <input 
                                type="checkbox" 
                                :value="file.path"
                                v-model="selectedFileIds"
                                class="rounded border-gray-300"
                            />
                        </td>
                        <td class="border border-gray-300 px-3 py-2">
                            <div class="flex items-center gap-3">
                                <i :class="file.icon" class="text-gray-600 text-xl"></i>
                                <a :href="file.url" target="_blank" download class="text-blue-600 hover:underline font-medium">
                                    {{ file.name }}
                                </a>
                            </div>
                        </td>
                        <td class="border border-gray-300 px-3 py-2">{{ formatFileSize(file.size) }}</td>
                        <td class="border border-gray-300 px-3 py-2">{{ file.mimeType || getFileInfo(file.name).type }}</td>
                        <td class="border border-gray-300 px-3 py-2">
                            <PrimaryButton 
                                icon="fas fa-trash" 
                                :onclick="() => $emit('delete-file', file.path)" 
                                :is-danger="true"
                                :is-small="true"
                                :disabled="deleting || isUploading">
                            </PrimaryButton>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Сообщение об отсутствии файлов (только для множественных файлов) -->
        <div v-else-if="!isUploading && !singleImage" class="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
            {{ $t('noFilesUploaded') }}
        </div>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'FileUploader',
    components: { PrimaryButton },
    props: {
        files: {
            type: Array,
            default: () => []
        },
        uploading: {
            type: Boolean,
            default: false
        },
        acceptedFileTypes: {
            type: String,
            default: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.md,.zip,.rar,.7z'
        },
        disabled: {
            type: Boolean,
            default: false
        },
        deleting: {
            type: Boolean,
            default: false
        },
        singleImage: {
            type: Boolean,
            default: false
        },
        currentImage: {
            type: String,
            default: ''
        }
    },
    emits: ['file-change', 'delete-file', 'delete-multiple-files'],
    data() {
        return {
            isDragOver: false,
            selectedFileIds: [],
            uploadingFiles: [],
            selectedImage: null
        }
    },
    computed: {
        isUploading() {
            return this.uploading || this.uploadingFiles.length > 0;
        },
        
        // Объединенная мапа для типов файлов
        fileTypeMap() {
            return {
                'pdf': { icon: 'fas fa-file-pdf text-red-600', type: 'PDF Document' },
                'doc': { icon: 'fas fa-file-word text-blue-600', type: 'Word Document' },
                'docx': { icon: 'fas fa-file-word text-blue-600', type: 'Word Document' },
                'xls': { icon: 'fas fa-file-excel text-green-600', type: 'Excel Spreadsheet' },
                'xlsx': { icon: 'fas fa-file-excel text-green-600', type: 'Excel Spreadsheet' },
                'ppt': { icon: 'fas fa-file-powerpoint text-orange-600', type: 'PowerPoint Presentation' },
                'pptx': { icon: 'fas fa-file-powerpoint text-orange-600', type: 'PowerPoint Presentation' },
                'txt': { icon: 'fas fa-file-alt text-gray-600', type: 'Text Document' },
                'md': { icon: 'fas fa-file-alt text-gray-600', type: 'Markdown Document' },
                'png': { icon: 'fas fa-file-image text-purple-600', type: 'PNG Image' },
                'jpg': { icon: 'fas fa-file-image text-purple-600', type: 'JPEG Image' },
                'jpeg': { icon: 'fas fa-file-image text-purple-600', type: 'JPEG Image' },
                'gif': { icon: 'fas fa-file-image text-purple-600', type: 'GIF Image' },
                'zip': { icon: 'fas fa-file-archive text-yellow-600', type: 'ZIP Archive' },
                'rar': { icon: 'fas fa-file-archive text-yellow-600', type: 'RAR Archive' },
                '7z': { icon: 'fas fa-file-archive text-yellow-600', type: '7Z Archive' }
            };
        },
        allFilesSelected() {
            return this.files && this.files.length > 0 && this.selectedFileIds.length === this.files.length;
        }
    },
    methods: {
        // Общий метод для обработки файлов
        processFiles(files) {
            if (!files || !files.length) return;
            
            // Преобразуем FileList в массив, если это необходимо
            const filesArray = Array.isArray(files) ? files : Array.from(files);
            const validFiles = this.filterValidFiles(filesArray);
            if (validFiles.length > 0) {
                this.$emit('file-change', validFiles);
            }
        },

        // Фильтрация файлов по допустимым типам
        filterValidFiles(files) {
            const allowedTypes = this.acceptedFileTypes.split(',').map(type => type.trim());
            const validFiles = files.filter(file => {
                const extension = '.' + file.name.split('.').pop().toLowerCase();
                return allowedTypes.includes(extension);
            });
            
            if (validFiles.length === 0) {
                alert('Недопустимый тип файла. Разрешены: ' + allowedTypes.join(', ').replace(/\./g, '').toUpperCase());
                return [];
            }
            
            if (validFiles.length < files.length) {
                alert(`Загружено ${validFiles.length} из ${files.length} файлов. Некоторые файлы имеют недопустимый тип.`);
            }
            
            return validFiles;
        },

        // Обработка выбора файлов через input
        handleFileChange(event) {
            if (this.disabled || this.isUploading) {
                this.clearFileInput();
                return;
            }
            
            if (this.singleImage) {
                this.processSingleImage(event.target.files);
            } else {
                this.processFiles(event.target.files);
            }
            this.clearFileInput();
        },

        // Обработка одиночного изображения
        processSingleImage(files) {
            if (!files || files.length === 0) return;
            
            const file = files[0];
            
            // Проверяем тип файла
            const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!allowedTypes.includes(extension)) {
                alert('Недопустимый тип файла. Разрешены только изображения: JPG, PNG, GIF, WEBP');
                return;
            }
            
            // Проверяем размер файла (максимум 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('Файл слишком большой. Максимальный размер: 5MB');
                return;
            }
            
            // Создаем превью изображения
            this.selectedImage = URL.createObjectURL(file);
            
            // Эмитим событие с файлом
            this.$emit('file-change', [file]);
        },

        // Удаление изображения
        removeImage() {
            this.selectedImage = null;
            this.$emit('file-change', []);
        },

        // Очистка поля ввода файлов
        clearFileInput() {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },

        // Методы для управления выбором файлов
        selectAllFiles() {
            this.selectedFileIds = this.files.map(file => file.path);
        },

        clearSelection() {
            this.selectedFileIds = [];
        },

        toggleAllFiles() {
            if (this.allFilesSelected) {
                this.clearSelection();
            } else {
                this.selectAllFiles();
            }
        },

        toggleAllFilesCheckbox(event) {
            if (event.target.checked) {
                this.selectAllFiles();
            } else {
                this.clearSelection();
            }
        },

        // Упрощенный метод для обновления прогресса загрузки
        updateUploadProgress(fileId, progress, error = null) {
            const fileIndex = this.uploadingFiles.findIndex(f => f.id === fileId);
            if (fileIndex !== -1) {
                this.uploadingFiles[fileIndex].progress = progress;
                if (error) {
                    this.uploadingFiles[fileIndex].error = error;
                }
            }
        },

        // Объединенный метод для получения иконки и типа файла
        getFileInfo(filename) {
            if (!filename) return { icon: 'fas fa-file text-gray-600', type: 'Unknown File Type' };
            
            const ext = filename.split('.').pop().toLowerCase();
            return this.fileTypeMap[ext] || { icon: 'fas fa-file text-gray-600', type: 'Unknown File Type' };
        },

        // Drag & Drop методы
        handleDragOver(event) {
            if (!this.isUploading && !this.disabled) {
                this.isDragOver = true;
            }
        },
        
        handleDragLeave(event) {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.isDragOver = false;
            }
        },
        
        handleDrop(event) {
            this.isDragOver = false;
            
            if (this.disabled || this.isUploading) {
                return;
            }
            
            if (this.singleImage) {
                this.processSingleImage(event.dataTransfer.files);
            } else {
                this.processFiles(event.dataTransfer.files);
            }
        },

        formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    }
}
</script>
