import i18n from "@/i18n";
import { hasPermission as checkPermission } from "@/permissions";
import { isSimpleUserAccount } from "@/utils/userUtils";
import { filterMenu } from "./menuUtils";
import { normCashFilter, normClientFilter } from "./normalize";

const t = (key, params) =>
  i18n?.global?.t ? i18n.global.t(key, params) : String(key);

export const getters = {
  user: (state) => state.user,
  permissions: (state) => state.permissions,
  hasPermission: (state) => (perm) => {
    return checkPermission(perm, state.permissions, state.user);
  },
  isSimpleUserAccount: (state) => isSimpleUserAccount(state.user),
  units: (state) => state.units,
  currencies: (state) => state.currencies,
  users: (state) => state.users,
  warehouses: (state) => state.warehouses,
  cashRegisters: (state) => state.cashRegisters,
  clients: (state) => state.clients,
  lastProducts: (state) => state.lastProducts,
  allProducts: (state) => state.allProducts,
  categories: (state) => state.categories,
  projects: (state) => state.projects,
  orders: (state) => state.orders,
  activeProjects: (state) =>
    state.projects.filter((p) => !p.status || p.status.isVisible !== false),
  orderStatuses: (state) => state.orderStatuses,
  projectStatuses: (state) => state.projectStatuses,
  taskStatuses: (state) => state.taskStatuses,
  transactionCategories: (state) => state.transactionCategories,
  roles: (state) => state.roles,
  leaveTypes: (state) => state.leaveTypes,
  orderStatusCategories: (state) => state.orderStatusCategories,
  getUnitShortName: (state) => (id) => {
    const unit = state.units.find((unit) => unit.id === id);
    return unit ? unit.short_name : "";
  },
  getCurrencySymbol: (state) => (id) => {
    const currency = state.currencies.find((currency) => currency.id === id);
    return currency ? currency.code : t("noCurrency");
  },
  currentCompany: (state) => state.currentCompany,
  userCompanies: (state) => state.userCompanies,
  currentCompanyId: (state) => state.currentCompany?.id || null,
  chats: (state) => state.chats || [],
  chatsTotalUnread: (state) =>
    (state.chats || []).reduce(
      (sum, chat) => sum + (Number(chat?.unreadCount) > 0 ? Number(chat.unreadCount) : 0),
      0
    ),
  inAppUnreadTotal: (state) => state.inAppUnreadTotal || 0,
  usersForCurrentCompany: (state) => {
    const currentCompanyId = state.currentCompany?.id;
    const activeUsers = state.users.filter((user) => Boolean(user?.isActive));
    if (!currentCompanyId) {
      return activeUsers;
    }
    return activeUsers.filter((user) => {
      if (!user.companies || user.companies.length === 0) {
        return false;
      }
      return user.companies.some(
        (company) => Number(company.id) === Number(currentCompanyId)
      );
    });
  },
  soundEnabled: (state) => state.soundEnabled,
  roundingDecimals: (state) => state.currentCompany.roundingDecimals,
  displayDecimals: (state) => state.currentCompany.displayDecimals,
  roundingEnabled: (state) => state.currentCompany.roundingEnabled,
  roundingOrdersEnabled: (state) =>
    state.currentCompany.roundingEnabled && state.currentCompany.roundingOrdersEnabled,
  roundingContractsEnabled: (state) =>
    state.currentCompany.roundingEnabled && state.currentCompany.roundingContractsEnabled,
  roundingWarehouseEnabled: (state) =>
    state.currentCompany.roundingEnabled && state.currentCompany.roundingWarehouseEnabled,
  roundingDirection: (state) => state.currentCompany.roundingDirection,
  roundingCustomThreshold: (state) => state.currentCompany.roundingCustomThreshold,
  roundingQuantityDecimals: (state) => state.currentCompany.roundingQuantityDecimals,
  roundingQuantityEnabled: (state) => state.currentCompany.roundingQuantityEnabled,
  roundingQuantityDirection: (state) => state.currentCompany.roundingQuantityDirection,
  roundingQuantityCustomThreshold: (state) =>
    state.currentCompany.roundingQuantityCustomThreshold,
  clientTypeFilter: (state) => normClientFilter(state.clientTypeFilter),
  clientBalancesCurrencyId: (state) => state.clientBalancesCurrencyId,
  cashRegisterFilter: (state) => normCashFilter(state.cashRegisterFilter),
  mainMenuItems: (state, getters) => filterMenu(state, state.menuItems.main, getters),
  availableMenuItems: (state, getters) =>
    filterMenu(state, state.menuItems.available, getters),
  leavesViewMode: (state) => state.viewModes.leaves || "table",
  projectsViewMode: (state) => state.viewModes.projects || "kanban",
  ordersViewMode: (state) => state.viewModes.orders || "table",
  leadsViewMode: (state) => state.viewModes.leads || "table",
  tasksViewMode: (state) => state.viewModes.tasks || "kanban",
  clientsViewMode: (state) => state.viewModes.clients || "table",
  usersViewMode: (state) => state.viewModes.users || "table",
  transactionsViewMode: (state) => state.viewModes.transactions || "table",
  salesViewMode: (state) => state.viewModes.sales || "table",
  invoicesViewMode: (state) => state.viewModes.invoices || "table",
  transfersViewMode: (state) => state.viewModes.transfers || "table",
  transactionCategoriesViewMode: (state) =>
    state.viewModes.transactionCategories || "table",
  listPageViewMode: (state) => (key) =>
    (state.viewModes.listPages && state.viewModes.listPages[key]) || "table",
};
