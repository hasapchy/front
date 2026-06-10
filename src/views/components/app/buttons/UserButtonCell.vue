<template>
  <div>
    <div
      class="flex h-full w-full items-center justify-center gap-2 rounded"
      :class="cellClass"
      @dblclick.stop="openUserModal"
    >
      <template v-if="resolvedUser">
        <div>
          <span v-html="displayTextHtml" />
          <div
            v-if="displayPosition"
            class="text-xs text-gray-500 dark:text-[var(--text-secondary)]"
          >
            {{ displayPosition }}
          </div>
        </div>
      </template>
      <span v-else>-</span>
    </div>
    <SideModalDialog
      :show-form="modalOpen"
      :title="userModalDialogTitle"
      :onclose="() => modalOpen = false"
      :level="level"
    >
      <UsersCreatePage
        v-if="modalOpen && userForModal"
        :key="userForModal.id"
        :editing-item="userForModal"
        @saved="handleSaved"
        @saved-error="() => modalOpen = false"
        @deleted="handleDeleted"
        @close-request="() => modalOpen = false"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import UsersController from '@/api/UsersController';
import { getUserDisplayName, getUserPosition } from '@/utils/displayUtils';
import { highlightMatches } from '@/utils/searchUtils';
import { normalizeUserForCell } from '@/utils/userCellUtils';

export default {
    name: 'UserButtonCell',
    components: {
        SideModalDialog,
        UsersCreatePage: defineAsyncComponent(() => import('@/views/pages/users/UsersCreatePage.vue')),
    },
    props: {
        user: {
            type: Object,
            default: null
        },
        searchQuery: {
            type: String,
            default: ''
        },
        showPosition: {
            type: Boolean,
            default: false
        },
        displayField: {
            type: String,
            default: 'name'
        },
        level: {
            type: Number,
            default: 3
        }
    },
    data() {
        return {
            modalOpen: false,
            userForModal: null
        };
    },
    computed: {
        resolvedUser() {
            return normalizeUserForCell(this.user);
        },
        canOpen() {
            return Boolean(this.resolvedUser?.id) && this.$store.getters.hasPermission('users_view');
        },
        cellClass() {
            if (!this.canOpen) {
                return 'text-gray-900 dark:text-[var(--text-primary)]';
            }
            return 'cursor-pointer text-[#2a6496] hover:underline dark:text-white dark:hover:text-white dark:hover:opacity-90';
        },
        displayText() {
            if (!this.resolvedUser) {
                return '-';
            }
            if (this.displayField === 'id') {
                return String(this.resolvedUser.id ?? '');
            }
            return getUserDisplayName(this.resolvedUser) || '-';
        },
        displayPosition() {
            if (!this.showPosition) {
                return '';
            }
            return getUserPosition(this.resolvedUser);
        },
        displayTextHtml() {
            const text = this.displayText;
            const query = this.searchQuery?.trim();
            return query ? highlightMatches(text, query) : text;
        },
        userModalDialogTitle() {
            if (!this.modalOpen) {
                return '';
            }
            return sideModalCrudTitle(this.$t.bind(this), {
                item: this.userForModal,
                entityGenitiveKey: 'sideModalGenUser',
                entityNominativeKey: 'sideModalNomUser',
                getName: getUserDisplayName,
            });
        },
    },
    methods: {
        async openUserModal() {
            if (!this.canOpen) {
                return;
            }
            try {
                this.userForModal = await UsersController.getItem(this.resolvedUser.id);
            } catch {
                return;
            }
            this.modalOpen = true;
        },
        handleSaved(updatedUser) {
            this.$emit('user-updated', updatedUser);
            this.modalOpen = false;
            this.userForModal = null;
        },
        handleDeleted() {
            this.modalOpen = false;
            this.userForModal = null;
        }
    }
};
</script>
