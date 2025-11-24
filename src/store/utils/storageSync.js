import CompanyDto from "@/dto/companies/CompanyDto";

// ✅ Listener для синхронизации между вкладками
export function initializeStorageSync(_store) {
  let lastEmittedCompanyId = null;
  let debounceTimer = null;

  window.addEventListener("storage", (e) => {
    // ✅ Слушаем ТОЛЬКО события от ДРУГИХ вкладок (не от этой вкладки)
    if (e.key !== "hasap_vuex_cache") return;

    try {
      const newState = JSON.parse(e.newValue || "{}");
      const oldState = JSON.parse(e.oldValue || "{}");
      const newCompanyId = newState.company?.currentCompany?.id;
      const oldCompanyId = oldState.company?.currentCompany?.id;

      // ✅ Базируемся на ТЕКУЩЕМ store, а не на oldValue из события
      const currentTabCompanyId = _store.state.company?.currentCompany?.id || null;

      // ✅ Эмитим только если в ДРУГОЙ вкладке действительно сменилась компания
      if (!newCompanyId || newCompanyId === currentTabCompanyId) return;
      if (!oldCompanyId || newCompanyId === oldCompanyId) return;
      if (newCompanyId === lastEmittedCompanyId) return;

      // Если уже синхронизируемся — выходим
      if (_store.state.company?.isSyncingCompanyFromOtherTab) return;

      // ✅ Небольшой debounce, чтобы не сыпать событиями при серии записей
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          _store.commit("company/SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", true);

          // ⚡ Не дергаем сервер: берем компанию из newState другой вкладки
          if (newState.company?.currentCompany) {
            const newCompanyId = newState.company.currentCompany?.id;
            const currentCompanyId = _store.state.company?.currentCompany?.id;

            if (newCompanyId === currentCompanyId) {
              return;
            }

            const updatedCompany = new CompanyDto(newState.company.currentCompany);
            _store.commit("company/SET_CURRENT_COMPANY", updatedCompany);
            await _store.dispatch("company/loadCompanyData");
            lastEmittedCompanyId = updatedCompany.id;
            // company-changed теперь обрабатывается через Vuex watchers в компонентах
          }
        } catch (err) {
          console.error("Ошибка синхронизации текущей компании:", err);
        } finally {
          _store.commit("company/SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", false);
        }
      }, 50);
    } catch (error) {
      console.error("Ошибка синхронизации между вкладками:", error);
    }
  });
}

