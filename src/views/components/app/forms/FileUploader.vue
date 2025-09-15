<template>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('files') }}</label>
        <div 
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
                :disabled="uploading"
                class="hidden"
                ref="fileInput"
                :accept="acceptedFileTypes"
            />
            <button
                type="button"
                @click="$refs.fileInput.click()"
                :disabled="uploading"
                class="w-full text-center py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <i class="fas fa-cloud-upload-alt text-2xl mb-2"></i>
                <p v-if="!isDragOver">{{ $t('clickToUploadFiles') }}</p>
                <p v-else class="text-blue-600 font-medium">{{ $t('dropFilesToUpload') }}</p>
            </button>
        </div>
        
        <!-- Прогресс загрузки -->
        <div v-if="uploading" class="mt-4 p-4 bg-blue-50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <span class="text-blue-700 font-medium">{{ $t('uploadingFiles') }}...</span>
                <span class="text-blue-600">{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-blue-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{width: uploadProgress + '%'}"></div>
            </div>
        </div>
        
        <!-- Таблица файлов -->
        <div v-if="files && files.length > 0" class="mt-4">
            <table class="w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileName') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileSize') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('fileType') }}</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium">{{ $t('actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="file in files" :key="file.path" class="hover:bg-gray-50">
                        <td class="border border-gray-300 px-3 py-2">
                            <div class="flex items-center gap-3">
                                <i :class="file.icon" class="text-gray-600 text-xl"></i>
                                <a :href="file.url" target="_blank" download class="text-blue-600 hover:underline font-medium">
                                    {{ file.name }}
                                </a>
                            </div>
                        </td>
                        <td class="border border-gray-300 px-3 py-2">{{ formatFileSize(file.size) }}</td>
                        <td class="border border-gray-300 px-3 py-2">{{ file.mimeType || getFileType(file.name) }}</td>
                        <td class="border border-gray-300 px-3 py-2">
                            <PrimaryButton 
                                icon="fas fa-trash" 
                                :onclick="() => $emit('delete-file', file.path)" 
                                :is-danger="true"
                                :is-small="true">
                            </PrimaryButton>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Кнопка массового удаления -->
            <div v-if="selectedFileIds.length > 0" class="mt-4 flex justify-end">
                <PrimaryButton 
                    icon="fas fa-trash" 
                    :onclick="() => $emit('delete-multiple-files', selectedFileIds)" 
                    :is-danger="true">
                </PrimaryButton>
            </div>
        </div>
        
        <!-- Сообщение об отсутствии файлов -->
        <div v-else-if="!uploading" class="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
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
        uploadProgress: {
            type: Number,
            default: 0
        },
        acceptedFileTypes: {
            type: String,
            default: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.md,.zip,.rar,.7z'
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['file-change', 'delete-file', 'delete-multiple-files'],
    data() {
        return {
            isDragOver: false,
            selectedFileIds: []
        }
    },
    methods: {
        handleFileChange(event) {
            if (this.disabled) {
                this.$emit('file-change', null);
                if (this.$refs.fileInput) {
                    this.$refs.fileInput.value = '';
                }
                return;
            }
            
            const files = event.target.files;
            if (!files.length) return;

            this.$emit('file-change', files);
            
            // Очищаем поле файлов
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = '';
            }
        },
        
        // Drag & Drop методы
        handleDragOver(event) {
            if (!this.uploading && !this.disabled) {
                this.isDragOver = true;
            }
        },
        
        handleDragLeave(event) {
            // Проверяем, что мы действительно покидаем область загрузки
            if (!event.currentTarget.contains(event.relatedTarget)) {
                this.isDragOver = false;
            }
        },
        
        handleDrop(event) {
            this.isDragOver = false;
            
            if (this.disabled) {
                return;
            }
            
            if (this.uploading) {
                return;
            }
            
            const files = Array.from(event.dataTransfer.files);
            if (!files.length) return;
            
            // Фильтруем файлы по допустимым типам
            const allowedTypes = this.acceptedFileTypes.split(',').map(type => type.trim());
            const validFiles = files.filter(file => {
                const extension = '.' + file.name.split('.').pop().toLowerCase();
                return allowedTypes.includes(extension);
            });
            
            if (validFiles.length === 0) {
                alert('Недопустимый тип файла. Разрешены: ' + allowedTypes.join(', ').replace(/\./g, '').toUpperCase());
                return;
            }
            
            if (validFiles.length < files.length) {
                alert(`Загружено ${validFiles.length} из ${files.length} файлов. Некоторые файлы имеют недопустимый тип.`);
            }
            
            this.$emit('file-change', validFiles);
        },

        formatFileSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        getFileType(filename) {
            if (!filename) return '';
            const ext = filename.split('.').pop().toLowerCase();
            const typeMap = {
                'pdf': 'PDF Document',
                'doc': 'Word Document',
                'docx': 'Word Document',
                'xls': 'Excel Spreadsheet',
                'xlsx': 'Excel Spreadsheet',
                'txt': 'Text Document',
                'png': 'PNG Image',
                'jpg': 'JPEG Image',
                'jpeg': 'JPEG Image',
                'gif': 'GIF Image',
                'zip': 'ZIP Archive',
                'rar': 'RAR Archive'
            };
            return typeMap[ext] || 'Unknown File Type';
        }
    }
}
</script>
