const activityLogRu = {
  timeline: {
    amount: 'сумма: {value}',
  },
  client: {
    created: 'Клиент создан',
    updated: 'Клиент обновлён',
    deleted: 'Клиент удалён',
    default: 'Клиент: {event}',
  },
  project: {
    created: 'Проект создан',
    updated: 'Проект обновлён',
    deleted: 'Проект удалён',
    default: 'Проект: {event}',
  },
  project_contract: {
    created: 'Контракт создан',
    updated: 'Контракт обновлён',
    deleted: 'Контракт удалён',
    default: 'Контракт: {event}',
    returned_signed: 'Подписан',
    returned_unsigned: 'Не подписан',
  },
  transaction: {
    created: 'Создана транзакция',
    updated: 'Транзакция обновлена',
    deleted: 'Транзакция удалена',
    default: 'Транзакция: {event}',
  },
  order: {
    created: 'Создан заказ',
    updated: 'Заказ обновлен',
    deleted: 'Заказ удален',
    default: 'Заказ: {event}',
    created_numbered: 'Создан заказ #{id}',
    updated_numbered: 'Заказ обновлён #{id}',
    deleted_numbered: 'Заказ удалён #{id}',
  },
  order_temp_product: {
    created: 'Добавлен временный товар ({name})',
    updated: 'Изменён временный товар ({name})',
    deleted: 'Удалён временный товар ({name})',
    default: 'Временный товар: {event}',
  },
  order_product: {
    created: 'Добавлен товар/услуга: {name}',
    updated: 'Изменён товар/услуга: {name}',
    deleted: 'Удалён товар/услуга: {name}',
    default: 'Товар/услуга: {event}',
  },
  invoice: {
    created: 'Создан счет',
    updated: 'Счет обновлен',
    deleted: 'Счет удален',
    default: 'Счет: {event}',
  },
  invoice_product: {
    created: 'Добавлен товар в счет: {name}',
    updated: 'Изменён товар в счете: {name}',
    deleted: 'Удалён товар из счета: {name}',
    default: 'Товар в счете: {event}',
  },
  task: {
    created: 'Задача создана',
    updated: 'Задача обновлена',
    deleted: 'Задача удалена',
    default: 'Задача: {event}',
  },
  defaults: {
    temp_product: 'Временный товар',
    order_product: 'Товар/услуга',
  },
};

const activityLogEn = {
  timeline: {
    amount: 'amount: {value}',
  },
  client: {
    created: 'Client created',
    updated: 'Client updated',
    deleted: 'Client deleted',
    default: 'Client: {event}',
  },
  project: {
    created: 'Project created',
    updated: 'Project updated',
    deleted: 'Project deleted',
    default: 'Project: {event}',
  },
  project_contract: {
    created: 'Contract created',
    updated: 'Contract updated',
    deleted: 'Contract deleted',
    default: 'Contract: {event}',
    returned_signed: 'Signed',
    returned_unsigned: 'Not signed',
  },
  transaction: {
    created: 'Transaction created',
    updated: 'Transaction updated',
    deleted: 'Transaction deleted',
    default: 'Transaction: {event}',
  },
  order: {
    created: 'Order created',
    updated: 'Order updated',
    deleted: 'Order deleted',
    default: 'Order: {event}',
    created_numbered: 'Order created #{id}',
    updated_numbered: 'Order updated #{id}',
    deleted_numbered: 'Order deleted #{id}',
  },
  order_temp_product: {
    created: 'Temporary line item added ({name})',
    updated: 'Temporary line item updated ({name})',
    deleted: 'Temporary line item removed ({name})',
    default: 'Temporary line item: {event}',
  },
  order_product: {
    created: 'Product/service added: {name}',
    updated: 'Product/service updated: {name}',
    deleted: 'Product/service removed: {name}',
    default: 'Product/service: {event}',
  },
  invoice: {
    created: 'Invoice created',
    updated: 'Invoice updated',
    deleted: 'Invoice deleted',
    default: 'Invoice: {event}',
  },
  invoice_product: {
    created: 'Invoice line added: {name}',
    updated: 'Invoice line updated: {name}',
    deleted: 'Invoice line removed: {name}',
    default: 'Invoice line: {event}',
  },
  task: {
    created: 'Task created',
    updated: 'Task updated',
    deleted: 'Task deleted',
    default: 'Task: {event}',
  },
  defaults: {
    temp_product: 'Temporary line item',
    order_product: 'Product/service',
  },
};

const activityLogTm = {
  timeline: {
    amount: 'mukdary: {value}',
  },
  client: {
    created: 'Müşderi döredildi',
    updated: 'Müşderi täzelendi',
    deleted: 'Müşderi pozuldy',
    default: 'Müşderi: {event}',
  },
  project: {
    created: 'Taslama döredildi',
    updated: 'Taslama täzelendi',
    deleted: 'Taslama pozuldy',
    default: 'Taslama: {event}',
  },
  project_contract: {
    created: 'Şertnama döredildi',
    updated: 'Şertnama täzelendi',
    deleted: 'Şertnama pozuldy',
    default: 'Şertnama: {event}',
    returned_signed: 'Gol çekilen',
    returned_unsigned: 'Gol çekilmedik',
  },
  transaction: {
    created: 'Transaksiýa döredildi',
    updated: 'Transaksiýa täzelendi',
    deleted: 'Transaksiýa pozuldy',
    default: 'Transaksiýa: {event}',
  },
  order: {
    created: 'Sargyt döredildi',
    updated: 'Sargyt täzelendi',
    deleted: 'Sargyt pozuldy',
    default: 'Sargyt: {event}',
    created_numbered: 'Sargyt döredildi #{id}',
    updated_numbered: 'Sargyt täzelendi #{id}',
    deleted_numbered: 'Sargyt pozuldy #{id}',
  },
  order_temp_product: {
    created: 'Wagtlaýyn haryt goşuldy ({name})',
    updated: 'Wagtlaýyn haryt üýtgedildi ({name})',
    deleted: 'Wagtlaýyn haryt aýryldy ({name})',
    default: 'Wagtlaýyn haryt: {event}',
  },
  order_product: {
    created: 'Haryt/hyzmat goşuldy: {name}',
    updated: 'Haryt/hyzmat üýtgedildi: {name}',
    deleted: 'Haryt/hyzmat aýryldy: {name}',
    default: 'Haryt/hyzmat: {event}',
  },
  invoice: {
    created: 'Hasaba alyş döredildi',
    updated: 'Hasaba alyş täzelendi',
    deleted: 'Hasaba alyş pozuldy',
    default: 'Hasaba alyş: {event}',
  },
  invoice_product: {
    created: 'Hasaba alyş setiri goşuldy: {name}',
    updated: 'Hasaba alyş setiri täzelendi: {name}',
    deleted: 'Hasaba alyş setiri aýryldy: {name}',
    default: 'Hasaba alyş setiri: {event}',
  },
  task: {
    created: 'Wezip döredildi',
    updated: 'Wezip täzelendi',
    deleted: 'Wezip pozuldy',
    default: 'Wezip: {event}',
  },
  defaults: {
    temp_product: 'Wagtlaýyn setir',
    order_product: 'Haryt/hyzmat',
  },
};

export default {
  ru: activityLogRu,
  en: activityLogEn,
  tm: activityLogTm,
};
