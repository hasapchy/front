<template>
  <ul class="mb-3 flex border-b border-[var(--nav-accent)] dark:border-[var(--border-subtle)]">
    <li
      v-for="tab in tabs"
      :key="tab.name"
      class="-mb-px mr-1"
    >
      <a
        :class="[
          'inline-block cursor-pointer px-4 py-1 text-[14px] font-normal transition-colors',
          tab.name === activeTab
            ? 'relative z-[1] rounded-t border border-b-white border-l-[var(--nav-accent)] border-r-[var(--nav-accent)] border-t-[var(--nav-accent)] bg-white text-[var(--nav-accent)] dark:border-b-[var(--surface-muted)] dark:border-l-[var(--border-subtle)] dark:border-r-[var(--border-subtle)] dark:border-t-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]'
            : 'rounded-t text-[var(--nav-accent)] hover:text-[var(--nav-accent-hover)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]/50 dark:hover:text-[var(--label-accent)]'
        ]"
        @click.prevent="tabClick(tab.name)"
      >
        <span class="inline-flex items-center gap-1.5">
          <i
            v-if="tab.icon"
            :class="tab.icon"
          />
          <span>{{ tab.label }}</span>
        </span>
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