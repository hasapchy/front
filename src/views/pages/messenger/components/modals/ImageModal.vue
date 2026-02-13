<template>
    <div
      class="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      @click.self="$emit('close')"
    >
      <div class="relative max-w-4xl max-h-screen p-4">
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center z-10"
          @click="$emit('close')"
        >
          <i class="fas fa-times text-lg"></i>
        </button>
  
        <!-- Image -->
        <img
          v-if="image"
          :src="fileUrl(image)"
          :alt="image.name"
          class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          @click.stop
        />
      </div>
    </div>
  </template>
  
  <script>
  import { buildStorageUrl, buildTenantStorageUrl } from '../utils/helpers'

  export default {
    name: 'ImageModal',
    props: {
      image: {
        type: Object,
        default: null
      }
    },
    methods: {
      /** URL: при наличии image.url — его; иначе tenant по текущей компании (чаты в tenant). */
      fileUrl(file) {
        const path = typeof file === 'string' ? file : file?.path
        if (typeof file === 'object' && file?.url) return file.url
        const companyId = this.$store.state.currentCompany?.id
        return buildTenantStorageUrl(path, companyId) || buildStorageUrl(path)
      }
    }
  }
  </script>