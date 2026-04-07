<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-[var(--surface-page)]">
    <div class="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-[var(--surface-elevated)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
      <h1 class="mb-2 text-xl font-bold text-gray-800 dark:text-[var(--text-primary)]">
        {{ $t("maintenanceTitle") }}
      </h1>
      <p class="mb-6 text-gray-600 dark:text-[var(--text-secondary)]">
        {{ $t("maintenanceMessage") }}
      </p>
      <form
        class="space-y-4"
        @submit.prevent="submitBypass"
      >
        <input
          v-model="bypassKey"
          type="text"
          :placeholder="$t('maintenanceBypassPlaceholder')"
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/40 dark:border-[var(--input-border)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
          :class="{ 'border-red-500 dark:border-red-400': error }"
        >
        <p
          v-if="error"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ error }}
        </p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full cursor-pointer rounded-full border border-transparent bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-[var(--nav-accent)]/25 transition-all hover:brightness-110 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ loading ? $t("loading") : $t("maintenanceBypassSubmit") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import api, { MAINTENANCE_BYPASS_KEY } from "@/api/axiosInstance";

export default {
  name: "MaintenancePage",
  data() {
    return {
      bypassKey: "",
      loading: false,
      error: null,
    };
  },
  methods: {
    async submitBypass() {
      if (!this.bypassKey.trim()) {
        this.error = this.$t("maintenanceBypassRequired");
        return;
      }

      this.loading = true;
      this.error = null;

      localStorage.setItem(MAINTENANCE_BYPASS_KEY, this.bypassKey.trim());

      try {
        const response = await api.get("transaction_categories/all");
        if (response.status === 200) {
          this.$router.push("/");
        }
      } catch (err) {
        if (err.response?.status === 503) {
          this.error = this.$t("maintenanceBypassInvalid");
          localStorage.removeItem(MAINTENANCE_BYPASS_KEY);
        } else {
          this.error = this.$t("error");
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
