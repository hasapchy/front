<template>
  <div class="flex h-full min-h-0 flex-col gap-4">
    <div
      v-if="entry"
      class="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">
            {{ entry.entryNumber || entry.displayName }}
          </h2>
          <p class="text-sm text-[var(--text-muted)]">
            {{ entry.entryDateFormatted() }} · {{ entry.statusLabel($t) }}
            <span v-if="entry.templateKey"> · {{ entry.templateKeyLabel($t) }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <PrimaryButton
            v-if="entry.status === 'draft' && canUpdate"
            :onclick="confirmPost"
          >
            {{ $t('post') }}
          </PrimaryButton>
          <PrimaryButton
            v-if="entry.status === 'posted' && canUpdate"
            :onclick="confirmReverse"
          >
            {{ $t('reverse') }}
          </PrimaryButton>
        </div>
      </div>
      <p
        v-if="entry.description"
        class="mt-2 text-sm"
      >
        {{ entry.description }}
      </p>
    </div>

    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="!loading"
        display-view-mode="table"
      >
        <template #table>
          <DraggableTable
            table-key="finance.journal_entry_lines"
            :columns-config="lineColumns"
            :table-data="lineRows"
            :item-mapper="lineMapper"
          />
        </template>
      </CardListViewShell>
      <TableSkeleton
        v-else
        :columns="4"
      />
    </transition>

    <AlertDialog
      :dialog="postDialog"
      :descr="$t('journalEntryConfirmPost')"
      :confirm-text="$t('post')"
      :leave-text="$t('cancel')"
      @confirm="postEntry"
      @leave="postDialog = false"
    />
    <AlertDialog
      :dialog="reverseDialog"
      :descr="$t('journalEntryConfirmReverse')"
      :confirm-text="$t('reverse')"
      :leave-text="$t('cancel')"
      @confirm="reverseEntry"
      @leave="reverseDialog = false"
    />
  </div>
</template>

<script>
import JournalEntryController from '@/api/JournalEntryController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    components: {
        DraggableTable,
        TableSkeleton,
        CardListViewShell,
        PrimaryButton,
        AlertDialog,
    },
    mixins: [companyChangeMixin, getApiErrorMessageMixin, notificationMixin],
    data() {
        return {
            loading: false,
            entry: null,
            postDialog: false,
            reverseDialog: false,
            lineColumns: [
                { name: 'accountLabel', label: 'financialAccount', visible: true },
                { name: 'debitFormatted', label: 'debit', visible: true, align: 'right' },
                { name: 'creditFormatted', label: 'credit', visible: true, align: 'right' },
            ],
        };
    },
    computed: {
        canUpdate() {
            return this.$store.getters.hasPermission('journal_entries_update')
                || this.$store.getters.hasPermission('journal_entries_update_all');
        },
        lineRows() {
            return this.entry?.lineDisplayRows(this.$t.bind(this)) ?? [];
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler() {
                this.fetchItem();
            },
        },
    },
    methods: {
        async fetchItem() {
            const id = this.$route.params.id;
            if (!id) {
                return;
            }
            this.loading = true;
            try {
                this.entry = await JournalEntryController.getItem(id);
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            } finally {
                this.loading = false;
            }
        },
        lineMapper(line, column) {
            return line[column];
        },
        confirmPost() {
            this.postDialog = true;
        },
        confirmReverse() {
            this.reverseDialog = true;
        },
        async postEntry() {
            this.postDialog = false;
            try {
                this.entry = await JournalEntryController.post(this.entry.id);
                this.showSuccess(this.$t('journalEntryPosted'));
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            }
        },
        async reverseEntry() {
            this.reverseDialog = false;
            const reason = window.prompt(this.$t('journalEntryReverseReason'));
            if (reason === null) {
                return;
            }
            try {
                await JournalEntryController.reverse(this.entry.id, reason || null);
                await this.fetchItem();
                this.showSuccess(this.$t('journalEntryReversed'));
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            }
        },
        onCompanyChanged() {
            this.fetchItem();
        },
    },
};
</script>
