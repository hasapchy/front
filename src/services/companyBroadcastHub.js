import { eventBus } from "@/eventBus";
import { companyBroadcast, subscribeCompanyPrivate } from "@/services/companyPrivateEcho";

export const COMPANY_BROADCAST = {
  ORDERS_FIRST_STAGE: "company-broadcast:orders-first-stage",
  TRANSACTION_CREATED: "company-broadcast:transaction-created",
};

const registry = [
  {
    segment: companyBroadcast.segment.orders,
    eventName: companyBroadcast.event.orderFirstStageCountUpdated,
    bus: COMPANY_BROADCAST.ORDERS_FIRST_STAGE,
    canSubscribe: () => true,
  },
  {
    segment: companyBroadcast.segment.transactions,
    eventName: companyBroadcast.event.transactionCreated,
    bus: COMPANY_BROADCAST.TRANSACTION_CREATED,
    canSubscribe: (getters) => getters.hasPermission("transactions_view"),
  },
];

let releases = [];

function clearSubscriptions() {
  for (const release of releases) {
    release();
  }
  releases = [];
}

export function syncCompanyBroadcastSubscriptions(store) {
  clearSubscriptions();
  const companyId = store.state.currentCompany?.id ?? null;
  if (!companyId) {
    return;
  }
  const getters = store.getters;
  for (const row of registry) {
    if (!row.canSubscribe(getters)) {
      continue;
    }
    releases.push(
      subscribeCompanyPrivate(companyId, row.segment, row.eventName, (payload) => {
        eventBus.emit(row.bus, payload);
      }),
    );
  }
}

export function startCompanyBroadcastHub(store) {
  return store.watch(
    (state) => [
      state.currentCompany?.id ?? null,
      Array.isArray(state.permissions) ? state.permissions.join("\0") : "",
    ],
    () => {
      syncCompanyBroadcastSubscriptions(store);
    },
    { immediate: true },
  );
}
