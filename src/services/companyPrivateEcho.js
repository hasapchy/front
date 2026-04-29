import echo from "./echo";

export const companyBroadcast = {
  segment: {
    orders: "orders",
    transactions: "transactions",
  },
  event: {
    orderFirstStageCountUpdated: ".order.first-stage-count.updated",
    transactionCreated: ".transaction.created",
  },
};

export function subscribeCompanyPrivate(companyId, segment, eventName, handler) {
  const channelName = `company.${companyId}.${segment}`;
  const channel = echo.private(channelName);
  channel.listen(eventName, handler);
  return () => {
    channel.stopListening(eventName);
    echo.leave(channelName);
  };
}
