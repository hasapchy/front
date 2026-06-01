import CacheInvalidator from "@/cache";
import { eventBus } from "@/eventBus";
import globalChatRealtime from "@/services/globalChatRealtime";
import inAppNotificationsRealtime from "@/services/inAppNotificationsRealtime";
import { STORE_CONFIG } from "./config";

async function flushCaches() {
  try {
    await CacheInvalidator.invalidateAll();
  } catch (error) {
    console.error("Error clearing cache on company change:", error);
  }
}

async function syncChatRealtime(store) {
  await store.dispatch("loadChats", { force: true });
  if (globalChatRealtime.initialized) {
    await globalChatRealtime.resubscribe();
  } else {
    await globalChatRealtime.initialize(store);
  }
}

export async function syncCompany(_store, oldCompanyId, companyId) {
  if (oldCompanyId && oldCompanyId !== companyId) {
    await flushCaches();
  }
  _store.commit("CLEAR_COMPANY_DATA");
  _store.commit("SET_CURRENCIES", []);
  _store.commit("SET_MENU_ITEMS", { main: [], available: [] });
  await _store.dispatch("loadCompanyData");
  await _store.dispatch("loadCurrencies");
  await _store.dispatch("loadUnits");
  await _store.dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: false });
  await _store.dispatch("initializeMenu");
  eventBus.emit("company-changed", companyId);
  await syncChatRealtime(_store);
  if (inAppNotificationsRealtime.initialized) {
    await inAppNotificationsRealtime.reinitialize();
  } else {
    await inAppNotificationsRealtime.initialize(_store);
  }
  await _store.dispatch("refreshInAppUnreadTotal");
}

export function listenStorage(_store) {
  let lastEmittedCompanyId = null;
  let debounceTimer = null;

  window.addEventListener("storage", (e) => {
    if (e.key === STORE_CONFIG.localStorageKeys.companyContextSync) {
      if (_store.state.isSyncingCompanyFromOtherTab) {
        return;
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(async () => {
        try {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", true);
          const prevId = _store.state.currentCompany?.id || null;
          await _store.dispatch("loadCurrentCompany", { forceFromServer: true });
          const nextId = _store.state.currentCompany?.id || null;
          if (nextId && prevId !== nextId) {
            await syncCompany(_store, prevId, nextId);
          }
        } catch (err) {
          console.error("Company context sync error:", err);
        } finally {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", false);
        }
      }, 50);
      return;
    }

    if (
      e.key !== STORE_CONFIG.localStorageKeys.userSettings &&
      e.key !== STORE_CONFIG.localStorageKeys.persistKey
    ) {
      return;
    }

    try {
      const newState = JSON.parse(e.newValue || "{}");
      const oldState = JSON.parse(e.oldValue || "{}");
      const newCompanyId = newState.currentCompany?.id;
      const oldCompanyId = oldState.currentCompany?.id;

      const currentTabCompanyId = _store.state.currentCompany?.id || null;

      if (!newCompanyId || newCompanyId === currentTabCompanyId) return;
      if (!oldCompanyId || newCompanyId === oldCompanyId) return;
      if (newCompanyId === lastEmittedCompanyId) return;

      if (_store.state.isSyncingCompanyFromOtherTab) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", true);

          const prevId = _store.state.currentCompany?.id || null;
          await _store.dispatch("loadCurrentCompany", { forceFromServer: true });
          const nextId = _store.state.currentCompany?.id || null;
          if (nextId && prevId !== nextId) {
            await syncCompany(_store, prevId, nextId);
            lastEmittedCompanyId = nextId;
          }
        } catch (err) {
          console.error("Current company sync error:", err);
        } finally {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", false);
        }
      }, 50);
    } catch (error) {
      console.error("Cross-tab sync error:", error);
    }
  });
}
