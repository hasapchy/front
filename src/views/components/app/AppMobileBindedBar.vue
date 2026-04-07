<template>
  <Teleport to="body">
    <nav
      v-if="show"
      class="fixed inset-x-0 bottom-0 z-40 min-[1200px]:!hidden"
    >
      <div class="border-t border-gray-200 bg-white/95 shadow-[0_-2px_12px_rgba(0,0,0,0.07)] backdrop-blur-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]/95 dark:shadow-[0_-2px_12px_rgba(0,0,0,0.35)]">
        <div
          class="max-h-[4.25rem] gap-0.5 px-1 pt-1.5 pb-0 [-webkit-overflow-scrolling:touch]"
          :class="
            equalWidthTabs
              ? 'grid w-full overflow-x-hidden'
              : 'flex overflow-x-auto overscroll-x-contain'
          "
          :style="equalWidthTabs ? { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` } : undefined"
          role="tablist"
        >
          <router-link
            v-for="tab in tabs"
            :key="tab.path"
            :to="tab.path"
            role="tab"
            class="flex flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 font-semibold leading-tight transition-colors"
            :class="[
              equalWidthTabs ? 'min-w-0' : 'min-w-[3.25rem] max-w-[4.75rem] flex-none',
              tabLabelClass,
              activePath === tab.path
                ? 'bg-slate-100 text-[var(--nav-accent)] dark:bg-[var(--surface-muted)] dark:text-white'
                : 'text-gray-600 active:bg-gray-100 dark:text-[var(--text-secondary)] dark:active:bg-[var(--surface-muted)]',
            ]"
            :aria-current="activePath === tab.path ? 'page' : undefined"
          >
            <span
              class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-transparent text-[1.05rem] leading-none"
              :class="
                activePath === tab.path
                  ? 'text-[var(--nav-accent)] dark:rounded-full dark:border-0 dark:bg-white dark:text-[var(--nav-accent)]'
                  : 'text-gray-600 dark:text-[var(--text-secondary)]'
              "
            >
              <i
                :class="getTabIcon(tab.path)"
                class="pointer-events-none leading-none"
              />
            </span>
            <span class="line-clamp-2 w-full text-center">{{ tab.name }}</span>
          </router-link>
        </div>
      </div>
    </nav>
  </Teleport>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useWindowSize } from '@vueuse/core';
import { useBindedTabs } from '@/composables/useBindedTabs';
import { getTabIcon, resolveActiveBindedPath } from '@/utils/headerBindedTabs';

export default {
    setup() {
        const route = useRoute();
        const { width } = useWindowSize();
        const tabs = useBindedTabs();
        const show = computed(() => width.value < 1200 && tabs.value.length > 0);
        const activePath = computed(() => resolveActiveBindedPath(route.path, tabs.value));
        const equalWidthTabs = computed(() => tabs.value.length > 0 && tabs.value.length <= 6);
        const tabLabelClass = computed(() => {
            const n = tabs.value.length;
            if (n <= 2) {
                return 'text-[11px]';
            }
            if (n <= 4) {
                return 'text-[10.5px]';
            }
            return 'text-[10px]';
        });
        return {
            getTabIcon,
            show,
            tabs,
            activePath,
            equalWidthTabs,
            tabLabelClass,
        };
    },
};
</script>
