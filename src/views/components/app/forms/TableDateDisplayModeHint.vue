<template>
  <div class="mb-1 flex items-center justify-end">
    <FieldHint
      :text="$t('tableDateDisplayModeHint')"
      :aria-label="$t('tableDateDisplayModeHintAria')"
      placement="top"
      :flip="false"
    />
  </div>
</template>

<script>
import FieldHint from '@/views/components/app/forms/FieldHint.vue';

export default {
    name: 'TableDateDisplayModeHint',
    components: { FieldHint },
};
</script>
