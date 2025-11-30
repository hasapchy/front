<template>
    <span>
        <i :class="typeIconClass" :title="typeTitle"></i>
        <i v-if="isConflict" class="fas fa-exclamation-triangle text-[#D53935] mr-2" title="Проблемный клиент"></i>
        <i v-if="isSupplier" class="fas fa-truck text-[#3571A4] mr-2" title="Поставщик"></i>
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
            const typeIcons = {
                company: 'fas fa-building text-[#3571A4] mr-2',
                employee: 'fas fa-id-badge text-[#3571A4] mr-2',
                investor: 'fas fa-hand-holding-usd text-[#3571A4] mr-2'
            };
            return typeIcons[this.client.clientType] || 'fas fa-user text-[#3571A4] mr-2';
        },
        typeTitle() {
            const titles = {
                company: 'Компания',
                employee: 'Сотрудник',
                investor: 'Инвестор'
            };
            return titles[this.client.clientType] || 'Индивидуальный клиент';
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

