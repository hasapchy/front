<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-[var(--surface-page)]">
    <div class="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-[var(--surface-elevated)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
      <p class="mb-2 text-5xl font-bold text-[var(--nav-accent)]">
        404
      </p>
      <h1 class="mb-2 text-xl font-bold text-gray-800 dark:text-[var(--text-primary)]">
        {{ $t('pageNotFoundTitle') }}
      </h1>
      <p class="mb-6 text-gray-600 dark:text-[var(--text-secondary)]">
        {{ $t('pageNotFoundMessage') }}
      </p>
      <button
        type="button"
        class="w-full cursor-pointer rounded-full border border-transparent bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-[var(--nav-accent)]/25 transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]/40"
        @click="goPrimary"
      >
        {{ primaryLabel }}
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'NotFoundPage',
  computed: {
    ...mapState({
      user: (state) => state.user,
    }),
    primaryLabel() {
      return this.user ? this.$t('pageNotFoundGoHome') : this.$t('pageNotFoundLogin');
    },
  },
  mounted() {
    const suffix = 'Hasapp.online';
    document.title = `${this.$t('pageNotFoundTitle')} - ${suffix}`;
  },
  methods: {
    goPrimary() {
      this.$router.push(this.user ? '/' : '/auth/login');
    },
  },
};
</script>
