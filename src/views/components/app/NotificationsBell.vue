<template>
  <div class="relative">
    <template v-if="showBell">
      <button type="button"
        class="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--nav-accent)] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:border-0 dark:bg-white dark:text-[var(--nav-accent)] dark:hover:bg-white/90"
        :aria-label="$t('notificationsTitle')" :aria-expanded="listModalOpen" @click="toggleListModal">
        <i class="fas fa-bell text-lg" />
        <span v-if="unreadTotal > 0"
          class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0">
          {{ unreadTotal > 99 ? "99+" : unreadTotal }}
        </span>
      </button>
    </template>

    <SideModalDialog :show-form="listModalOpen" :title="$t('notificationsTitle')" :onclose="closeListModal"
      :width-ratio="0.42">
      <div class="flex h-full min-h-0 flex-col">
        <div
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-[var(--border-subtle)]">
          <button type="button"
            class="text-sm font-medium text-[var(--nav-accent)] transition-colors hover:underline dark:text-white"
            @click="openSettingsFromList">
            <i class="fas fa-sliders mr-1.5 text-xs" />
            {{ $t("notificationSettingsOpen") }}
          </button>
          <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <PrimaryButton v-if="unreadTotal > 0" icon="fas fa-check-double" :onclick="markAllRead"
              :is-loading="markAllReadLoading" :aria-label="$t('notificationsMarkAllRead')">
              {{ $t("notificationsMarkAllRead") }}
            </PrimaryButton>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">{{ $t("soundLabel")
              }}</span>
              <SoundToggle size="sm" />
            </div>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div v-if="loading" class="py-12 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            …
          </div>
          <div v-else-if="items.length" class="space-y-6">
            <div v-for="group in notificationGroups" :key="group.dayKey">
              <div v-if="group.label" class="mb-3 flex justify-center">
                <div class="rounded-lg bg-gray-100 px-4 py-2 dark:bg-[var(--surface-muted)]">
                  <div class="text-sm font-bold text-gray-700 dark:text-[var(--text-primary)]">
                    {{ group.label }}
                  </div>
                </div>
              </div>
              <ul class="divide-y divide-gray-100 dark:divide-[var(--border-subtle)]">
                <li v-for="n in group.items" :key="n.id">
                  <button type="button"
                    class="flex w-full gap-3 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
                    :class="n.read_at ? 'opacity-70' : ''" @click="openNotification(n)">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base"
                      :class="notificationChannelStyle(n.channel_key).boxClass"
                      :title="notificationChannelLabel(n.channel_key)">
                      <i :class="notificationChannelStyle(n.channel_key).iconClass" aria-hidden="true" />
                    </span>
                    <span class="flex min-w-0 flex-1 flex-col gap-1">
                      <span class="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)]">{{ notificationText(n).title
                      }}</span>
                      <span v-if="notificationText(n).body" class="text-xs text-gray-600 dark:text-[var(--text-secondary)]">{{ notificationText(n).body
                      }}</span>
                      <span class="text-[11px] text-gray-400 dark:text-[var(--text-secondary)]">{{
                        formatNotificationTime(n.created_at) }}</span>
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="py-16 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t("notificationsEmpty") }}
          </div>
        </div>
      </div>
    </SideModalDialog>

    <SideModalDialog :show-form="settingsModalOpen" :title="$t('notificationSettingsTitle')"
      :onclose="closeSettingsModal" :level="1">
      <div class="min-h-0 flex-1 overflow-auto p-4">
        <div v-if="settingsLoading" class="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
          {{ $t("notificationSettingsLoading") }}
        </div>
        <template v-else>
          <p v-if="!settingsChannels.length" class="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
            {{ settingsChannelsEmptyHint }}
          </p>
          <div v-else
            class="rounded-md border border-gray-300 bg-gray-50 p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
            <div class="mb-3">
              <label
                class="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">
                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[var(--nav-accent)]"
                  :checked="allSettingsEnabled" @change="toggleAllSettings">
                <span>{{ $t("notificationSettingsEnableAll") }}</span>
              </label>
            </div>
            <div class="flex flex-col gap-3 border-t border-gray-200 pt-3 dark:border-[var(--border-subtle)]">
              <label v-for="ch in settingsChannels" :key="ch.key"
                class="flex cursor-pointer items-center justify-between gap-2 text-sm text-gray-800 dark:text-[var(--text-primary)]">
                <span>{{ $t(`notificationChannel_${ch.key}`) }}</span>
                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-[var(--nav-accent)]"
                  :checked="ch.enabled" @change="onSettingsChannelToggle(ch, $event)">
              </label>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="flex w-full flex-wrap items-center gap-2">
          <PrimaryButton icon="fas fa-save" :onclick="saveNotificationSettings" :is-loading="saveSettingsLoading"
            :disabled="!settingsChannels.length || settingsLoading" :aria-label="$t('save')" />
        </div>
      </template>
    </SideModalDialog>

    <SideModalDialog :show-form="orderDetailModalOpen" :title="orderDetailModalTitle" :onclose="closeOrderDetailModal"
      :level="1">
      <OrderCreatePage v-if="orderDetailModalOpen && orderDetailEditingItem" :key="orderDetailEditingItem.id"
        :editing-item="orderDetailEditingItem" @saved="closeOrderDetailModal" @saved-silent="closeOrderDetailModal"
        @saved-error="closeOrderDetailModal" @deleted="closeOrderDetailModal" @deleted-error="closeOrderDetailModal"
        @close-request="closeOrderDetailModal" />
    </SideModalDialog>

    <SideModalDialog :show-form="clientDetailModalOpen" :title="clientDetailModalTitle"
      :onclose="closeClientDetailModal" :level="1">
      <ClientCreatePage v-if="clientDetailModalOpen && clientDetailEditingItem" :key="clientDetailEditingItem.id"
        :editing-item="clientDetailEditingItem" @saved="closeClientDetailModal" @saved-error="closeClientDetailModal"
        @deleted="closeClientDetailModal" @deleted-error="closeClientDetailModal"
        @close-request="closeClientDetailModal" />
    </SideModalDialog>

    <SideModalDialog :show-form="transactionDetailModalOpen" :title="transactionDetailModalTitle"
      :onclose="closeTransactionDetailModal" :level="1">
      <TransactionCreatePage v-if="transactionDetailModalOpen && transactionDetailEditingItem"
        :key="transactionDetailEditingItem.id" :editing-item="transactionDetailEditingItem"
        @saved="closeTransactionDetailModal" @saved-error="closeTransactionDetailModal"
        @deleted="closeTransactionDetailModal" @deleted-error="closeTransactionDetailModal"
        @close-request="closeTransactionDetailModal" />
    </SideModalDialog>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { eventBus } from "@/eventBus";
import InAppNotificationController from "@/api/InAppNotificationController";
import OrderController from "@/api/OrderController";
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import { getClientDisplayName } from "@/utils/displayUtils";
import { isAdmin } from "@/permissions/checker";
import SideModalDialog, { sideModalCrudTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SoundToggle from "@/views/components/app/SoundToggle.vue";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import ClientCreatePage from "@/views/pages/clients/ClientCreatePage.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import dayjs from "dayjs";

export default {
  name: "NotificationsBell",
  components: {
    SideModalDialog,
    PrimaryButton,
    SoundToggle,
    OrderCreatePage,
    ClientCreatePage,
    TransactionCreatePage,
  },
  data() {
    return {
      listModalOpen: false,
      loading: false,
      items: [],
      markAllReadLoading: false,
      settingsModalOpen: false,
      settingsChannels: [],
      settingsLoading: false,
      saveSettingsLoading: false,
      settingsLoadError: false,
      orderDetailModalOpen: false,
      orderDetailEditingItem: null,
      clientDetailModalOpen: false,
      clientDetailEditingItem: null,
      transactionDetailModalOpen: false,
      transactionDetailEditingItem: null,
    };
  },
  computed: {
    ...mapGetters({
      unreadTotal: "inAppUnreadTotal",
    }),
    showBell() {
      return Boolean(this.$store.state.user && this.$store.getters.currentCompanyId);
    },
    allSettingsEnabled() {
      return (
        this.settingsChannels.length > 0 &&
        this.settingsChannels.every((c) => c.enabled)
      );
    },
    settingsChannelsEmptyHint() {
      if (this.settingsLoadError) {
        return this.$t("notificationSettingsLoadError");
      }
      if (isAdmin(this.$store.state.user)) {
        return this.$t("notificationSettingsAdminEmptyHint");
      }
      return this.$t("notificationSettingsNoChannelsHint");
    },
    orderDetailModalTitle() {
      if (!this.orderDetailModalOpen || !this.orderDetailEditingItem) {
        return "";
      }
      return sideModalCrudTitle(this.$t.bind(this), {
        item: this.orderDetailEditingItem,
        entityGenitiveKey: "sideModalGenOrder",
        entityNominativeKey: "sideModalNomOrder",
      });
    },
    clientDetailModalTitle() {
      if (!this.clientDetailModalOpen || !this.clientDetailEditingItem) {
        return "";
      }
      return sideModalCrudTitle(this.$t.bind(this), {
        item: this.clientDetailEditingItem,
        entityGenitiveKey: "sideModalGenClient",
        entityNominativeKey: "sideModalNomClient",
        getName: getClientDisplayName,
      });
    },
    transactionDetailModalTitle() {
      if (!this.transactionDetailModalOpen || !this.transactionDetailEditingItem) {
        return "";
      }
      return sideModalCrudTitle(this.$t.bind(this), {
        item: this.transactionDetailEditingItem,
        entityGenitiveKey: "sideModalGenTransaction",
        entityNominativeKey: "sideModalNomTransaction",
        getName: (tr) =>
          String(tr?.note ?? tr?.description ?? tr?.title ?? "").trim(),
      });
    },
    notificationGroups() {
      const list = this.items || [];
      const keysOrder = [];
      const byKey = new Map();
      for (const n of list) {
        const iso = n.created_at;
        const key =
          iso && dayjs(iso).isValid()
            ? dayjs(iso).format("YYYY-MM-DD")
            : "_nodate";
        if (!byKey.has(key)) {
          byKey.set(key, []);
          keysOrder.push(key);
        }
        byKey.get(key).push(n);
      }
      return keysOrder.map((dayKey) => ({
        dayKey,
        label: this.notificationDayHeaderLabel(dayKey),
        items: byKey.get(dayKey),
      }));
    },
  },
  watch: {
    listModalOpen(val) {
      if (val) {
        this.loadList();
      }
    },
    settingsModalOpen(val) {
      if (val) {
        this.loadSettingsChannels();
      }
    },
  },
  mounted() {
    eventBus.on("inapp-notification", this.onRealtime);
  },
  beforeUnmount() {
    eventBus.off("inapp-notification", this.onRealtime);
  },
  methods: {
    toggleListModal() {
      this.listModalOpen = !this.listModalOpen;
    },
    closeListModal() {
      this.listModalOpen = false;
    },
    openSettingsFromList() {
      this.listModalOpen = false;
      this.settingsModalOpen = true;
    },
    closeSettingsModal() {
      this.settingsModalOpen = false;
    },
    notificationDayHeaderLabel(dayKey) {
      if (dayKey === "_nodate") {
        return "";
      }
      const d = dayjs(dayKey);
      if (!d.isValid()) {
        return dayKey;
      }
      const today = dayjs();
      const yesterday = dayjs().subtract(1, "day");
      if (d.isSame(today, "day")) {
        return this.$t("today");
      }
      if (d.isSame(yesterday, "day")) {
        return this.$t("yesterday");
      }
      return d.format("DD.MM.YY");
    },
    formatNotificationTime(iso) {
      if (!iso) {
        return "";
      }
      const d = dayjs(iso);
      return d.isValid() ? d.format("HH:mm") : String(iso);
    },
    notificationChannelStyle(channelKey) {
      const map = {
        orders_new: {
          iconClass: "fas fa-clipboard-list",
          boxClass:
            "bg-sky-100 text-sky-700 dark:bg-sky-950/55 dark:text-sky-300",
        },
        sales_new: {
          iconClass: "fas fa-shopping-cart",
          boxClass:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/55 dark:text-emerald-300",
        },
        chats_new_message: {
          iconClass: "fas fa-comments",
          boxClass:
            "bg-violet-100 text-violet-700 dark:bg-violet-950/55 dark:text-violet-300",
        },
        tasks_new: {
          iconClass: "fas fa-tasks",
          boxClass:
            "bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-200",
        },
        news_new: {
          iconClass: "fas fa-newspaper",
          boxClass:
            "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200",
        },
        leaves_new: {
          iconClass: "fas fa-umbrella-beach",
          boxClass:
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/55 dark:text-cyan-200",
        },
        clients_new: {
          iconClass: "fas fa-user-plus",
          boxClass:
            "bg-teal-100 text-teal-800 dark:bg-teal-950/55 dark:text-teal-200",
        },
        birthdays_today: {
          iconClass: "fas fa-birthday-cake",
          boxClass:
            "bg-pink-100 text-pink-800 dark:bg-pink-950/55 dark:text-pink-200",
        },
        transactions_new: {
          iconClass: "fas fa-exchange-alt",
          boxClass:
            "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
        },
      };
      return (
        map[channelKey] || {
          iconClass: "fas fa-bell",
          boxClass:
            "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        }
      );
    },
    notificationChannelLabel(channelKey) {
      if (!channelKey) {
        return "";
      }
      const k = `notificationChannel_${channelKey}`;
      const t = this.$t(k);
      return t !== k ? t : "";
    },
    notificationText(notification) {
      if (notification?.channel_key === "birthdays_today") {
        const name = String(notification?.data?.birthday_user_name ?? "").trim();
        return {
          title: this.$t("notificationBirthdayTodayTitle"),
          body: name ? this.$t("notificationBirthdayTodayBody", { name }) : "",
        };
      }
      return {
        title: notification?.title || "",
        body: notification?.body || "",
      };
    },
    onRealtime(payload) {
      if (this.listModalOpen) {
        this.items = [payload, ...this.items.filter((x) => x.id !== payload.id)].slice(0, 50);
      }
    },
    async loadSettingsChannels() {
      this.settingsLoading = true;
      this.settingsLoadError = false;
      try {
        const res = await InAppNotificationController.getSettings();
        if (!res || !Array.isArray(res.channels)) {
          this.settingsLoadError = true;
          this.settingsChannels = [];
          return;
        }
        this.settingsChannels = res.channels.map((c) => ({ ...c }));
      } catch {
        this.settingsLoadError = true;
        this.settingsChannels = [];
      } finally {
        this.settingsLoading = false;
      }
    },
    onSettingsChannelToggle(ch, event) {
      ch.enabled = Boolean(event?.target?.checked);
    },
    toggleAllSettings(event) {
      const on = Boolean(event?.target?.checked);
      this.settingsChannels.forEach((c) => {
        c.enabled = on;
      });
    },
    async saveNotificationSettings() {
      if (!this.settingsChannels.length) {
        return;
      }
      this.saveSettingsLoading = true;
      try {
        const payload = {};
        this.settingsChannels.forEach((c) => {
          payload[c.key] = c.enabled;
        });
        const res = await InAppNotificationController.updateSettings(payload);
        if (Array.isArray(res?.channels)) {
          this.settingsChannels = res.channels.map((c) => ({ ...c }));
        }
      } catch {
        void 0;
      } finally {
        this.saveSettingsLoading = false;
      }
    },
    async loadList(options = {}) {
      const quiet = Boolean(options.quiet);
      if (!quiet) {
        this.loading = true;
      }
      try {
        const res = await InAppNotificationController.list({ per_page: 50 });
        this.items = res?.items || [];
        if (typeof res?.meta?.unread_total === "number") {
          this.$store.commit("SET_IN_APP_UNREAD_TOTAL", res.meta.unread_total);
        }
      } catch {
        if (!quiet) {
          this.items = [];
        }
      } finally {
        if (!quiet) {
          this.loading = false;
        }
      }
    },
    async markAllRead() {
      this.markAllReadLoading = true;
      try {
        await InAppNotificationController.markAllRead();
        this.$store.commit("SET_IN_APP_UNREAD_TOTAL", 0);
        await this.loadList({ quiet: true });
        this.listModalOpen = true;
      } catch {
        void 0;
      } finally {
        this.markAllReadLoading = false;
      }
    },
    orderIdFromNotificationData(data) {
      if (!data || typeof data !== "object") {
        return null;
      }
      const fromOrderId = Number(data.order_id);
      if (fromOrderId > 0) {
        return fromOrderId;
      }
      const route = String(data.route ?? "");
      let m = route.match(/\/orders\/(\d+)/);
      if (m) {
        return Number(m[1]);
      }
      m = route.match(/\/simple-orders\/(\d+)/);
      return m ? Number(m[1]) : null;
    },
    closeOrderDetailModal() {
      this.orderDetailModalOpen = false;
      this.orderDetailEditingItem = null;
    },
    closeClientDetailModal() {
      this.clientDetailModalOpen = false;
      this.clientDetailEditingItem = null;
    },
    closeTransactionDetailModal() {
      this.transactionDetailModalOpen = false;
      this.transactionDetailEditingItem = null;
    },
    transactionIdFromNotificationData(data) {
      if (!data || typeof data !== "object") {
        return null;
      }
      const fromId = Number(data.transaction_id);
      if (fromId > 0) {
        return fromId;
      }
      const m = String(data.route ?? "").match(/\/transactions\/(\d+)/);
      return m ? Number(m[1]) : null;
    },
    clientIdFromNotificationData(data) {
      if (!data || typeof data !== "object") {
        return null;
      }
      const fromId = Number(data.client_id);
      if (fromId > 0) {
        return fromId;
      }
      const m = String(data.route ?? "").match(/^\/clients\/(\d+)\/?$/);
      return m ? Number(m[1]) : null;
    },
    async openNotification(n) {
      if (!n.read_at) {
        try {
          await InAppNotificationController.markRead(n.id);
          this.$store.commit("ADJUST_IN_APP_UNREAD_TOTAL", -1);
          n.read_at = new Date().toISOString();
        } catch {
          void 0;
        }
      }
      const data = typeof n.data === "object" && n.data ? n.data : {};
      const route = typeof data.route === "string" ? data.route : null;
      this.listModalOpen = false;
      if (n.channel_key === "orders_new") {
        const orderId = this.orderIdFromNotificationData(data);
        if (orderId) {
          try {
            const item = await OrderController.getItem(orderId);
            if (item) {
              this.orderDetailEditingItem = item;
              this.orderDetailModalOpen = true;
              return;
            }
          } catch {
            void 0;
          }
          if (route) {
            await this.$router.push(route);
          }
          return;
        }
      }
      if (n.channel_key === "clients_new") {
        const clientId = this.clientIdFromNotificationData(data);
        if (clientId) {
          try {
            const item = await ClientController.getItem(clientId);
            if (item) {
              this.clientDetailEditingItem = item;
              this.clientDetailModalOpen = true;
              return;
            }
          } catch {
            void 0;
          }
          if (route) {
            await this.$router.push(route);
          }
          return;
        }
      }
      if (n.channel_key === "transactions_new") {
        const transactionId = this.transactionIdFromNotificationData(data);
        if (transactionId) {
          try {
            const item = await TransactionController.getItem(transactionId);
            if (item) {
              this.transactionDetailEditingItem = item;
              this.transactionDetailModalOpen = true;
              return;
            }
          } catch {
            void 0;
          }
          if (route) {
            await this.$router.push(route);
          }
          return;
        }
      }
      if (n.channel_key === "chats_new_message") {
        const chatId = Number(data.chat_id);
        if (chatId > 0) {
          const query = { open_chat: String(chatId) };
          const mid = Number(data.message_id);
          if (mid > 0) {
            query.focus_message = String(mid);
          }
          await this.$router.push({ path: "/messenger", query });
          return;
        }
      }
      if (route) {
        await this.$router.push(route);
      }
    },
  },
};
</script>
