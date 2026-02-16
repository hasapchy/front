<template>
  <div class="flex justify-center items-center min-h-screen bg-gray-100 p-4">
    <div class="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
      <h1 class="text-xl font-bold text-gray-800 mb-2">{{ $t("maintenanceTitle") }}</h1>
      <p class="text-gray-600 mb-6">{{ $t("maintenanceMessage") }}</p>
      <form @submit.prevent="submitBypass" class="space-y-4">
        <input
          v-model="bypassKey"
          type="text"
          :placeholder="$t('maintenanceBypassPlaceholder')"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#337AB7]"
          :class="{ 'border-red-500': error }"
        />
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-full border border-[#337AB7] bg-[#337AB7] text-white text-sm font-bold py-3 px-4 uppercase tracking-wider hover:bg-[#3571A4] focus:outline-none disabled:opacity-60"
        >
          {{ loading ? $t("loading") : $t("maintenanceBypassSubmit") }}
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import api, { getMaintenanceBypassKey } from "@/api/axiosInstance";

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

      localStorage.setItem(getMaintenanceBypassKey(), this.bypassKey.trim());

      try {
        const response = await api.get("transaction_categories/all");
        if (response.status === 200) {
          this.$router.push("/");
        }
      } catch (err) {
        if (err.response?.status === 503) {
          this.error = this.$t("maintenanceBypassInvalid");
          localStorage.removeItem(getMaintenanceBypassKey());
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
