<template>
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('profilePhoto') }}</label>
        <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <img v-if="photoPreview" :src="photoPreview" :alt="altText" class="w-full h-full object-cover">
                <i v-else class="fas fa-user text-gray-500 text-2xl"></i>
            </div>
            <div class="flex-1">
                <input 
                    type="file" 
                    @change="handlePhotoChange" 
                    accept="image/*"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                >
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProfilePhotoUploader',
    props: {
        photoPreview: {
            type: String,
            default: null
        },
        altText: {
            type: String,
            default: 'Profile Photo'
        }
    },
    emits: ['photo-change'],
    methods: {
        handlePhotoChange(event) {
            const file = event.target.files[0];
            if (file) {
                // Создаем превью изображения
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.$emit('photo-change', {
                        file: file,
                        preview: e.target.result
                    });
                };
                reader.readAsDataURL(file);
            } else {
                this.$emit('photo-change', null);
            }
        }
    }
}
</script>
