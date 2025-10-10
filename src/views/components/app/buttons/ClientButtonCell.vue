<template>
    <div class="w-full h-full px-2 py-2 cursor-pointer text-[#2a6496] hover:underline rounded"
        @click.stop="openClientModal"
        v-html="displayText">
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
            if (!this.client) return 'Не указан';
            
            const name = this.client.fullName();
            const firstPhone = this.client.phones?.[0]?.phone;
            const text = firstPhone ? `${name} (${firstPhone})` : name;
            
            if (this.searchQuery && this.searchQuery.trim()) {
                return this.highlightText(text, this.searchQuery);
            }
            
            return text;
        }
    },
    methods: {
        highlightText(text, search) {
            if (!text || !search) return text;
            const searchStr = String(search).trim();
            if (!searchStr) return text;
            
            const textStr = String(text);
            const regex = new RegExp(`(${searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return textStr.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
        },
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
