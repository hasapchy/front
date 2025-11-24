import CACHE_TTL from "@/constants/cacheTTL";
import { GLOBAL_REFERENCE_FIELDS, FIELDS_WITH_TIMESTAMP } from '../constants';

export function createPersistedStateConfig() {
  return {
    key: "hasap_vuex_cache",
    paths: [
      // Глобальные справочники
      "references.units",
      "references.currencies",
      "references.users",
      "references.orderStatuses",
      "references.projectStatuses",
      "references.transactionCategories",
      "references.productStatuses",
      "references.orderStatusesCustomOrder",

      // Данные компании
      "data.warehouses",
      "data.cashRegisters",
      "data.clientsData",
      "data.categories",
      "data.projectsData",
      "data.projectsDataCompanyId",
      "data.lastProductsData",
      "data.allProductsData",

      // Текущая компания и настройки
      "company.currentCompany",
      "company.lastCompanyId",
      "company.userCompanies",

      // UI настройки
      "ui.soundEnabled",
      "ui.clientTypeFilter",
      "ui.locale",
      "ui.perPage",
      "ui.ordersViewMode",
      "ui.projectsViewMode",
      "ui.menuItems",
      "ui.tableColumns",
      "ui.tableSort",
      "ui.kanbanColumnOrder",
      "ui.kanbanCompactView",
      "ui.basementServicesOrder",
      "ui.isMobileMenuOpen",

      // Auth
      "auth.token",
      "auth.tokenExpiresAt",

      // Cache
      "cache.queryCache",
    ],

    // Кастомная логика для проверки TTL при восстановлении
    getState: (key, storage) => {
      const value = storage.getItem(key);
      if (!value) return undefined;

      try {
        const state = JSON.parse(value);

        // ✅ Проверяем соответствие данных компании текущей компании
        const currentCompanyId = state.company?.currentCompany?.id || null;
        const projectsDataCompanyId = state.data?.projectsDataCompanyId || null;

        // Если projectsData принадлежит другой компании - очищаем
        if (
          projectsDataCompanyId &&
          currentCompanyId &&
          projectsDataCompanyId !== currentCompanyId
        ) {
          if (state.data) {
            state.data.projectsData = [];
            state.data.projectsDataCompanyId = null;
            state.data.projects = [];
          }
        }

        const now = Date.now();
        const fieldsToCheck = {
          // References
          ...GLOBAL_REFERENCE_FIELDS.reduce((acc, field) => {
            acc[`references.${field}`] = CACHE_TTL[field] || CACHE_TTL.default;
            return acc;
          }, {}),
          // Data
          "data.warehouses": CACHE_TTL.warehouses,
          "data.cashRegisters": CACHE_TTL.cashRegisters,
          "data.clientsData": CACHE_TTL.clients,
          "data.categories": CACHE_TTL.categories,
          "data.projectsData": CACHE_TTL.projects,
          "data.lastProductsData": CACHE_TTL.lastProductsData,
          "data.allProductsData": CACHE_TTL.allProductsData,
          // Cache
          "cache.queryCache": CACHE_TTL.queryCache,
        };

        Object.keys(fieldsToCheck).forEach((fieldPath) => {
          const [module, field] = fieldPath.split('.');
          if (field === "queryCache") {
            if (state[module]?.[field] && typeof state[module][field] === "object") {
              const cacheKeys = Object.keys(state[module][field]);
              cacheKeys.forEach((key) => {
                const cached = state[module][field][key];
                if (
                  cached &&
                  cached.timestamp &&
                  now - cached.timestamp > fieldsToCheck[fieldPath]
                ) {
                  delete state[module][field][key];
                }
              });
            }
          } else if (state[module]?.[field]?.length > 0) {
            const timestampKey = `${fieldPath}_timestamp`;
            const timestamp = storage.getItem(timestampKey);

            if (
              timestamp &&
              now - parseInt(timestamp) > fieldsToCheck[fieldPath]
            ) {
              if (state[module]) {
                state[module][field] = [];
              }
              storage.removeItem(timestampKey);
            }
          }
        });

        return state;
      } catch {
        return undefined;
      }
    },

    // Сохраняем timestamp при каждом изменении
    setState: (key, state, storage) => {
      storage.setItem(key, JSON.stringify(state));

      const now = Date.now().toString();
      const moduleFieldMap = {
        references: GLOBAL_REFERENCE_FIELDS,
        data: ["warehouses", "cashRegisters", "clientsData", "categories", "projectsData", "lastProductsData", "allProductsData"],
      };

      Object.keys(moduleFieldMap).forEach((module) => {
        moduleFieldMap[module].forEach((field) => {
          if (state[module]?.[field]?.length > 0) {
            storage.setItem(`${module}.${field}_timestamp`, now);
          }
        });
      });
    },
  };
}

