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
  },
  {
    segment: companyBroadcast.segment.transactions,
    eventName: companyBroadcast.event.transactionCreated,
    bus: COMPANY_BROADCAST.TRANSACTION_CREATED,
  },
];

let releases = [];

function clearSubscriptions() {
  for (const release of releases) {
    release();
  }
  releases = [];
}

export function syncCompanyBroadcastSubscriptions(companyId) {
  clearSubscriptions();
  if (!companyId) {
    return;
  }
  for (const row of registry) {
    releases.push(
      subscribeCompanyPrivate(companyId, row.segment, row.eventName, (payload) => {
        eventBus.emit(row.bus, payload);
      }),
    );
  }
}

export function startCompanyBroadcastHub(store) {
  return store.watch(
    (state) => state.currentCompany?.id ?? null,
    (companyId) => {
      syncCompanyBroadcastSubscriptions(companyId);
    },
    { immediate: true },
  );
}
