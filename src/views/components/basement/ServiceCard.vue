<template>
  <div 
    @click="$emit('select', service)"
    class="cursor-pointer flex-shrink-0 w-32 h-24 p-2 border border-gray-200 rounded-lg
           hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-white
           shadow-sm hover:shadow-md relative group grid grid-rows-[auto,1fr,auto] grid-cols-2">
    
    <!-- Метка (верхний левый угол, без фона) -->
    <div class="text-blue-500 text-[11px] font-bold col-start-1 row-start-1 self-start">
      ∞{{ service.unit_short_name || service.unit_name || '' }}
    </div>

    <!-- Иконка (верхний правый угол, без фона) -->
    <div class="flex items-center justify-center col-start-2 row-start-1 justify-self-end">
      <img v-if="service.imgUrl()" 
           :src="service.imgUrl()" 
           alt="icon"
           class="w-12 h-12 object-cover rounded-lg" 
           loading="lazy" />
      <span v-else v-html="service.icons()"></span>
    </div>

    <!-- Название (нижний левый угол, занимает всю ширину) -->
    <div class="col-span-2 row-start-3 text-left">
      <div class="font-medium text-gray-700 text-xs leading-tight line-clamp-2 group-hover:text-gray-900">
        {{ service.name }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceCard',
  props: {
    service: {
      type: Object,
      required: true
    }
  },
  emits: ['select']
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
