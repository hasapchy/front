<template>
  <span class="inline-flex flex-wrap items-center gap-1">
    <span class="inline-flex shrink-0 items-center justify-center rounded-md border-2 border-transparent dark:h-6 dark:w-6 dark:rounded-full dark:border-0 dark:bg-white">
      <i
        :class="typeIconClass"
        :title="typeTitle"
      />
    </span>
    <i
      v-if="isConflict"
      class="fas fa-angry text-[#D53935] mr-2"
      :title="$t('problemClient')"
    />
    <i
      v-if="isSupplier"
      class="fas fa-truck mr-2 text-[var(--nav-accent)]"
      :title="$t('supplier')"
    />
  </span>
</template>

<script>
export default {
    name: 'ClientIconsCell',
    props: {
        client: {
            type: Object,
            required: true
        }
    },
    computed: {
        typeIconClass() {
            const type = this.client?.clientType;
            const typeIcons = {
                company: 'fas fa-building text-[var(--nav-accent)] text-sm leading-none',
                employee: 'fas fa-id-badge text-[var(--nav-accent)] text-sm leading-none',
                investor: 'fas fa-hand-holding-usd text-[var(--nav-accent)] text-sm leading-none'
            };
            return typeIcons[type] || 'fas fa-user text-[var(--nav-accent)] text-sm leading-none';
        },
        typeTitle() {
            const type = this.client?.clientType;
            const keys = { company: 'company', employee: 'employee', investor: 'investor' };
            return this.$t(keys[type] || 'individual');
        },
        isConflict() {
            return this.client.isConflict;
        },
        isSupplier() {
            return this.client.isSupplier;
        }
    }
}
</script>

