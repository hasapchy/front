<template>
  <ul class="flex border-b border-[var(--nav-accent)] dark:border-[var(--border-subtle)]">
    <li
      v-for="tab in tabs"
      :key="tab.name"
      class="-mb-px mr-1"
    >
      <a
        :class="[
          'inline-block cursor-pointer px-4 py-1 font-semibold transition-colors',
          tab.name === activeTab
            ? 'rounded-t border-l border-r border-t border-[var(--nav-accent)] bg-white text-[var(--nav-accent)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]'
            : 'rounded-t text-[var(--nav-accent)] hover:text-[var(--nav-accent-hover)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]/50 dark:hover:text-[var(--label-accent)]'
        ]"
        @click.prevent="tabClick(tab.name)"
      >
        {{ tab.label }}
      </a>
    </li>
  </ul>
</template>

<script>
export default {
    props: {
        activeTab: {
            type: String,
            default: null
        },
        tabs: {
            type: Array,
            default: () => []
        },
        tabClick: {
            type: Function,
            default: () => {}
        }
    }
}
</script>