<template>
  <span>
    <i
      :class="typeIconClass"
      :title="typeTitle"
    />
    <i
      v-if="isConflict"
      class="fas fa-angry text-[#D53935] mr-2"
      :title="$t('problemClient')"
    />
    <i
      v-if="isSupplier"
      class="fas fa-truck text-[#3571A4] mr-2"
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
                company: 'fas fa-building text-[#3571A4] mr-2',
                employee: 'fas fa-id-badge text-[#3571A4] mr-2',
                investor: 'fas fa-hand-holding-usd text-[#3571A4] mr-2'
            };
            return typeIcons[type] || 'fas fa-user text-[#3571A4] mr-2';
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

