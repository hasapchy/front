<template>
  <div class="mt-4">
    <div
      v-if="loading"
      class="text-sm text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else-if="loadError"
      class="text-sm text-red-600 dark:text-red-400"
    >
      {{ loadError }}
    </div>
    <template v-else>
      <div class="mb-4 flex flex-wrap items-center justify-end gap-2">
        <PrimaryButton
          :onclick="confirmRevokeAll"
          :is-danger="true"
          :disabled="sessions.length === 0 || revokingAll"
        >
          {{ $t('revokeAllSessions') }}
        </PrimaryButton>
      </div>
      <div
        v-if="sessions.length === 0"
        class="text-sm text-gray-500 dark:text-[var(--text-secondary)]"
      >
        {{ $t('noActiveSessions') }}
      </div>
      <ul
        v-else
        class="space-y-3"
      >
        <li
          v-for="session in sessions"
          :key="session.id"
          class="rounded-lg border border-gray-200 p-3 dark:border-[var(--border-muted)]"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ session.deviceName || $t('unknownDevice') }}
                </span>
                <span
                  v-if="session.isCurrent"
                  class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-300"
                >
                  {{ $t('sessionCurrent') }}
                </span>
                <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]">
                  {{ clientTypeLabel(session.clientType) }}
                </span>
              </div>
              <p
                v-if="session.ipAddress"
                class="mt-1 text-sm text-gray-600 dark:text-[var(--text-secondary)]"
              >
                {{ $t('sessionIp') }}: {{ session.ipAddress }}
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-[var(--text-secondary)]">
                {{ $t('sessionLastActivity') }}: {{ formatActivity(session.lastActivityAt) }}
              </p>
            </div>
            <PrimaryButton
              v-if="isManageMode || !session.isCurrent"
              :onclick="() => confirmRevokeOne(session)"
              :is-danger="true"
              :disabled="revokingId === session.id"
            >
              {{ $t('revokeSession') }}
            </PrimaryButton>
          </div>
        </li>
      </ul>
    </template>

    <AlertDialog
      :dialog="confirmDialog"
      :title="confirmTitle"
      :descr="confirmDescr"
      :confirm-text="confirmActionText"
      :leave-text="$t('cancel')"
      @confirm="onConfirm"
      @leave="closeConfirm"
    />
  </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import UserSessionsController from "@/api/UserSessionsController";
import { setAuthSessionId } from "@/utils/authSessionStorage";
import { forceAuthLogout } from "@/utils/forceAuthLogout";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { formatDatabaseDateTime } from "@/utils/dateUtils";

export default {
  components: { PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessage, notificationMixin],
  props: {
    userId: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      loading: true,
      loadError: null,
      sessions: [],
      revokingId: null,
      revokingAll: false,
      confirmDialog: false,
      confirmTitle: "",
      confirmDescr: "",
      confirmActionText: "",
      pendingAction: null,
    };
  },
  computed: {
    isManageMode() {
      return this.userId != null;
    },
  },
  watch: {
    userId: {
      handler() {
        this.loadSessions();
      },
    },
  },
  mounted() {
    this.loadSessions();
  },
  methods: {
    async loadSessions() {
      this.loading = true;
      this.loadError = null;
      try {
        const data = this.isManageMode
          ? await UserSessionsController.listForUser(this.userId)
          : await UserSessionsController.list();
        if (!this.isManageMode && data?.current_auth_session_id != null) {
          setAuthSessionId(data.current_auth_session_id);
        }
        const list = Array.isArray(data?.sessions) ? data.sessions : [];
        this.sessions = list.map((row) => ({
          id: row.id,
          clientType: row.client_type,
          deviceName: row.device_name,
          ipAddress: row.ip_address,
          lastActivityAt: row.last_activity_at,
          createdAt: row.created_at,
          isCurrent: Boolean(row.is_current),
        }));
      } catch (e) {
        this.loadError = this.getApiErrorMessage(e);
      } finally {
        this.loading = false;
      }
    },
    clientTypeLabel(type) {
      if (type === "mobile") {
        return this.$t("sessionClientMobile");
      }
      if (type === "web") {
        return this.$t("sessionClientWeb");
      }
      return type || "—";
    },
    formatActivity(value) {
      if (!value) {
        return "—";
      }
      return formatDatabaseDateTime(value) || value;
    },
    confirmRevokeOne(session) {
      this.confirmTitle = this.$t("revokeSession");
      this.confirmDescr = this.$t("revokeSessionConfirm");
      this.confirmActionText = this.$t("revokeSession");
      this.pendingAction = () => this.revokeOne(session);
      this.confirmDialog = true;
    },
    confirmRevokeAll() {
      this.confirmTitle = this.$t("revokeAllSessions");
      this.confirmDescr = this.isManageMode
        ? this.$t("revokeAllEmployeeSessionsConfirm")
        : this.$t("revokeAllSessionsConfirm");
      this.confirmActionText = this.$t("revokeAllSessions");
      this.pendingAction = () => this.revokeAll();
      this.confirmDialog = true;
    },
    closeConfirm() {
      this.confirmDialog = false;
      this.pendingAction = null;
    },
    async onConfirm() {
      const action = this.pendingAction;
      this.closeConfirm();
      if (typeof action === "function") {
        await action();
      }
    },
    async revokeOne(session) {
      this.revokingId = session.id;
      try {
        if (this.isManageMode) {
          await UserSessionsController.revokeForUser(this.userId, session.id);
        } else {
          await UserSessionsController.revoke(session.id);
        }
        await this.loadSessions();
        this.showNotification(this.$t("success"), this.$t("sessionRevokedSuccess"), false);
      } catch (e) {
        this.showNotification(this.$t("error"), this.getApiErrorMessage(e), true);
      } finally {
        this.revokingId = null;
      }
    },
    async revokeAll() {
      this.revokingAll = true;
      try {
        if (this.isManageMode) {
          await UserSessionsController.revokeAllForUser(this.userId);
          await this.loadSessions();
          this.showNotification(
            this.$t("success"),
            this.$t("employeeSessionsRevokedAllSuccess"),
            false
          );
          this.revokingAll = false;
        } else {
          await UserSessionsController.revokeAll();
          await forceAuthLogout({ subtitleKey: "sessionRevokedAllSuccess" });
        }
      } catch (e) {
        this.showNotification(this.$t("error"), this.getApiErrorMessage(e), true);
        this.revokingAll = false;
      }
    },
  },
};
</script>
