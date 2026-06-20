<template>
  <div
    v-if="showTabs"
    class="shrink-0 px-4"
  >
    <ul
      class="mb-3 flex overflow-x-auto border-b border-[var(--nav-accent)] dark:border-[var(--border-subtle)] max-lg:hidden"
    >
      <li
        v-for="tab in tabs"
        :key="tab.path"
        class="-mb-px mr-1 shrink-0"
      >
        <router-link
          :to="tab.path"
          class="inline-block cursor-pointer px-4 py-1 font-semibold transition-colors"
          :class="
            activePath === tab.path
              ? 'rounded-t border border-b-0 border-[var(--nav-accent)] bg-white text-[var(--nav-accent)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]'
              : 'rounded-t text-[var(--nav-accent)] hover:text-[var(--nav-accent-hover)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]/50 dark:hover:text-[var(--label-accent)]'
          "
        >
          <span class="inline-flex items-center gap-1.5">
            <i
              v-if="tab.icon"
              :class="tab.icon"
            />
            <span>{{ tab.label }}</span>
          </span>
        </router-link>
      </li>
    </ul>

    <nav
      class="overflow-x-auto border-b border-gray-200 dark:border-[var(--border-subtle)] lg:hidden"
    >
      <div
        class="flex max-h-[4.25rem] gap-0.5 overscroll-x-contain px-1 pt-1.5 pb-2 [-webkit-overflow-scrolling:touch]"
        role="tablist"
      >
        <router-link
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          role="tab"
          class="flex min-w-[3.25rem] max-w-[4.75rem] flex-none flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] font-semibold leading-tight"
          :class="
            activePath === tab.path
              ? 'bg-slate-100 text-[var(--nav-accent)] dark:bg-[var(--surface-muted)] dark:text-white'
              : 'text-gray-600 active:bg-gray-100 dark:text-[var(--text-secondary)]'
          "
          :aria-current="activePath === tab.path ? 'page' : undefined"
        >
          <i
            v-if="tab.icon"
            :class="tab.icon"
            class="text-base leading-none"
          />
          <span class="line-clamp-2 w-full text-center">{{ tab.label }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useBindedTabs } from '@/composables/useBindedTabs';
import { resolveActiveBindedPath } from '@/utils/pageRouteTabGroups';

const route = useRoute();
const bindedTabs = useBindedTabs();
const tabs = computed(() => bindedTabs.value);
const showTabs = computed(() => tabs.value.length > 1);
const activePath = computed(() => resolveActiveBindedPath(route.path, tabs.value));
</script>
