<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">{{ $t('cropImage') }}</h3>
            </div>

            <!-- Cropper Area -->
            <div class="flex-1 overflow-auto p-6">
                <div class="cropper-wrapper">
                    <Cropper
                        ref="cropper"
                        :src="imageSrc"
                        :stencil-props="{
                            aspectRatio: 1,
                            movable: true,
                            resizable: true,
                        }"
                        :stencil-component="$options.components.CircleStencil"
                        class="cropper"
                        @change="onChange"
                    />
                </div>
                
                <!-- Preview -->
                <div v-if="previewUrl" class="mt-4 flex justify-center">
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">{{ $t('preview') }}</p>
                        <img 
                            :src="previewUrl" 
                            alt="Preview" 
                            class="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-md"
                        />
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    @click="cancel"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {{ $t('cancel') }}
                </button>
                <button
                    @click="cropImage"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {{ $t('apply') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { Cropper, CircleStencil } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

export default {
    components: {
        Cropper,
        CircleStencil,
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        imageSrc: {
            type: String,
            required: true
        }
    },
    emits: ['close', 'cropped'],
    data() {
        return {
            previewUrl: null,
            coordinates: null,
        };
    },
    methods: {
        onChange({ coordinates, canvas }) {
            this.coordinates = coordinates;
            if (canvas) {
                this.previewUrl = canvas.toDataURL();
            }
        },
        async cropImage() {
            const cropper = this.$refs.cropper;
            if (cropper) {
                const { canvas } = cropper.getResult();
                if (canvas) {
                    // Конвертируем canvas в blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            this.$emit('cropped', blob);
                            this.reset();
                        }
                    }, 'image/jpeg', 0.9);
                }
            }
        },
        cancel() {
            this.reset();
            this.$emit('close');
        },
        reset() {
            this.previewUrl = null;
            this.coordinates = null;
        }
    },
    watch: {
        show(newVal) {
            if (!newVal) {
                this.reset();
            }
        }
    }
};
</script>

<style scoped>
.cropper-wrapper {
    max-height: 400px;
    background: #f3f4f6;
    border-radius: 8px;
    overflow: hidden;
}

.cropper {
    height: 400px;
    background: #f3f4f6;
}
</style>

