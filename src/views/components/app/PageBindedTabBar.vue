<template>
  <div
    v-if="showTabs"
    class="shrink-0 px-4"
  >
    <div class="relative mb-3 max-lg:hidden">
      <div
        class="page-binded-tab-bar-line"
        aria-hidden="true"
      />
      <Draggable
        :list="draggableTabs"
        :animation="200"
        handle=".tab-drag-handle"
        item-key="name"
        tag="ul"
        class="relative z-[1] flex flex-wrap"
        @change="onDragChange"
      >
        <li
          v-for="tab in draggableTabs"
          :key="tab.name"
          class="group mr-1 shrink-0"
        >
          <router-link
            :to="tab.path"
            class="page-binded-tab inline-block cursor-pointer px-4 py-1 text-[14px] font-normal transition-colors"
            :class="{
              'page-binded-tab--active': activePath === tab.path,
            }"
          >
            <span class="inline-flex items-center gap-1.5">
              <i
                v-if="tab.icon"
                :class="tab.icon"
              />
              <span>{{ tab.label }}</span>
              <i
                class="tab-drag-handle fas fa-grip-vertical ml-0.5 cursor-grab text-[10px] opacity-0 transition-opacity group-hover:opacity-40"
                @click.prevent
              />
            </span>
          </router-link>
        </li>
      </Draggable>
    </div>

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
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { VueDraggableNext as Draggable } from 'vue-draggable-next';
import { useBindedTabs } from '@/composables/useBindedTabs';
import { findPageRouteTabGroup, resolveActiveBindedPath } from '@/utils/pageRouteTabGroups';
const route = useRoute();
const store = useStore();
const bindedTabs = useBindedTabs();
const tabs = computed(() => bindedTabs.value);
const showTabs = computed(() => tabs.value.length > 1);
const activePath = computed(() => resolveActiveBindedPath(route.path, tabs.value));
const groupId = computed(() => findPageRouteTabGroup(route.path)?.id ?? null);
const draggableTabs = ref([]);

watch(
  tabs,
  (next) => {
    draggableTabs.value = [...next];
  },
  { immediate: true }
);

function onDragChange() {
  const id = groupId.value;
  if (!id) {
    return;
  }
  store.dispatch('updatePageTabOrder', {
    groupId: id,
    orderedNames: draggableTabs.value.map((tab) => tab.name),
  });
}
</script>
