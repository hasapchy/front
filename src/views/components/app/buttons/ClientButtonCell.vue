<template>
  <div>
    <div
      class="w-full h-full cursor-pointer text-[#2a6496] hover:underline rounded"
      @dblclick.stop="openClientModal"
    >
      <span v-html="displayNameHtml" />
      <div
        v-if="displayPosition"
        class="text-xs text-gray-500"
      >
        {{ displayPosition }}
      </div>
    </div>
    <SideModalDialog
      :show-form="modalOpen"
      :onclose="() => modalOpen = false"
      :level="3"
    >
      <ClientCreatePage
        v-if="modalOpen"
        :editing-item="clientForModal"
        @saved="handleSaved"
        @saved-error="() => modalOpen = false"
        @deleted="handleDeleted"
      />
    </SideModalDialog>
  </div>
</template>


<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import ClientController from '@/api/ClientController';
import { highlightMatches } from '@/utils/searchUtils';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';

export default {
    components: {
        SideModalDialog,
        ClientCreatePage
    },
    props: {
        client: Object,
        searchQuery: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            modalOpen: false,
            clientForModal: null
        };
    },
    computed: {
        displayName() {
            return getClientDisplayName(this.client) || '-';
        },
        displayPosition() {
            return getClientDisplayPosition(this.client);
        },
        displayNameHtml() {
            if (!this.client) return '';
            const name = this.displayName;
            return (this.searchQuery && this.searchQuery.trim()) ? highlightMatches(name, this.searchQuery) : name;
        }
    },
    methods: {
        async openClientModal() {
            if (!this.client?.id) return;
            try {
                this.clientForModal = await ClientController.getItem(this.client.id);
            } catch (e) {
                return;
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
