<template>
    <div class="w-full h-full cursor-pointer text-[#2a6496] hover:underline rounded"
        @dblclick.stop="openClientModal"
        v-html="displayText">
    </div>

    <SideModalDialog :showForm="modalOpen" :onclose="() => modalOpen = false">
        <ClientCreatePage v-if="modalOpen" :editingItem="client" @saved="handleSaved" @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
    </SideModalDialog>
</template>


<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
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
            modalOpen: false
        };
    },
    computed: {
        displayText() {
            if (!this.client) return '';
            
            const name = this.client.fullName();
            const text = name;
            
            if (this.searchQuery && this.searchQuery.trim()) {
                return highlightMatches(text, this.searchQuery);
            }

            return text;
        }
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
