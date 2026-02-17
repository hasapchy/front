<template>
    <div class="w-full h-full cursor-pointer text-[#2a6496] hover:underline rounded"
        @dblclick.stop="openClientModal"
        v-html="displayText">
    </div>

    <SideModalDialog :showForm="modalOpen" :onclose="() => modalOpen = false">
        <ClientCreatePage v-if="modalOpen" :editingItem="clientForModal" @saved="handleSaved" @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
    </SideModalDialog>
</template>


<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import ClientController from '@/api/ClientController';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    props: {
        client: Object,
        searchQuery: {
            type: String,
            default: ''
        }
    },
    components: {
        SideModalDialog,
        ClientCreatePage
    },
    data() {
        return {
            modalOpen: false,
            clientForModal: null
        };
    },
    computed: {
        displayText() {
            if (!this.client) return '';
            const name = typeof this.client.fullName === 'function' ? this.client.fullName() : (this.client.clientName || '-');
            if (this.searchQuery && this.searchQuery.trim()) {
                return highlightMatches(name, this.searchQuery);
            }
            return name;
        }
    },
    methods: {
        async openClientModal() {
            if (!this.client?.id) return;
            if (Array.isArray(this.client?.phones)) {
                this.clientForModal = this.client;
            } else {
                try {
                    this.clientForModal = await ClientController.getItem(this.client.id);
                } catch (e) {
                    return;
                }
            }
            this.modalOpen = true;
        },
        handleSaved(updatedClient) {
            this.$emit('client-updated', updatedClient);
            this.modalOpen = false;
            this.clientForModal = null;
        },
        handleDeleted() {
            this.modalOpen = false;
            this.clientForModal = null;
        }
    }
};
</script>
