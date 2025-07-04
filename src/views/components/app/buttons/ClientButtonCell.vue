<template>
    <div class="w-full h-full px-2 py-2 cursor-pointer text-[#2a6496] hover:underline rounded"
        @click.stop="openClientModal">
        {{ client?.fullName() || 'Не указан' }}
    </div>

    <SideModalDialog :showForm="modalOpen" :onclose="() => modalOpen = false">
        <ClientCreatePage :editingItem="client" @saved="handleSaved" @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
    </SideModalDialog>
</template>


<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';

export default {
    props: {
        client: Object
    },
    components: {
        SideModalDialog,
        ClientCreatePage
    },
    data() {
        return {
            modalOpen: false
        };
    },
    methods: {
        openClientModal() {
            if (this.client) {
                this.modalOpen = true;
            }
        },
        handleSaved(updatedClient) {
            this.$emit('client-updated', updatedClient);
            this.modalOpen = false;
        },
        handleDeleted() {
            this.modalOpen = false;
        }
    }
};
</script>
