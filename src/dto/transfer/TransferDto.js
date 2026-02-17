import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class TransferDto {
    constructor(id, cashFromId, cashFromName, currencyFromId, currencyFromName, currencyFromSymbol, cashToId, cashToName, currencyToId, currencyToName, currencyToSymbol, amount, userId, userName, date = null, note = null, exchangeRate = null) {
        this.id = id;
        this.cashFromId = cashFromId;
        this.cashFromName = cashFromName;
        this.currencyFromId = currencyFromId;
        this.currencyFromName = currencyFromName;
        this.currencyFromSymbol = currencyFromSymbol;
        this.cashToId = cashToId;
        this.cashToName = cashToName;
        this.currencyToId = currencyToId;
        this.currencyToName = currencyToName;
        this.currencyToSymbol = currencyToSymbol;
        this.amount = amount;
        this.userId = userId;
        this.userName = userName;
        this.date = date;
        this.note = note;
        this.exchangeRate = exchangeRate;
    }

    formatDate() {
     return dtoDateFormatters.formatDate(this.date);
   }

   static fromApiArray(dataArray) {
     return createFromApiArray(dataArray, data => {
       return new TransferDto(
         data.id,
         data.cash_from_id,
         data.cash_from_name,
         data.currency_from_id,
         data.currency_from_name,
         data.currency_from_symbol,
         data.cash_to_id,
         data.cash_to_name,
         data.currency_to_id,
         data.currency_to_name,
         data.currency_to_symbol,
         data.amount,
         data.creator_id,
         data.user_name,
         data.date,
         data.note,
         data.exchange_rate || null
       );
     }).filter(Boolean);
   }
}