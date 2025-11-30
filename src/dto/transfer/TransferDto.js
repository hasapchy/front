import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatCurrency } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class TransferDto {
    constructor(id, cashFromId, cashFromName, currencyFromId, currencyFromName, currencyFromCode, currencyFromSymbol, cashToId, cashToName, currencyToId, currencyToName, currencyToCode, currencyToSymbol, amount, userId, userName, date = null, note = null) {
        this.id = id;
        this.cashFromId = cashFromId;
        this.cashFromName = cashFromName;
        this.currencyFromId = currencyFromId;
        this.currencyFromName = currencyFromName;
        this.currencyFromCode = currencyFromCode;
        this.currencyFromSymbol = currencyFromSymbol;
        this.cashToId = cashToId;
        this.cashToName = cashToName;
        this.currencyToId = currencyToId;
        this.currencyToName = currencyToName;
        this.currencyToCode = currencyToCode;
        this.currencyToSymbol = currencyToSymbol;
        this.amount = amount;
        this.userId = userId;
        this.userName = userName;
        this.date = date;
        this.note = note;
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
         data.currency_from_code,
         data.currency_from_symbol,
         data.cash_to_id,
         data.cash_to_name,
         data.currency_to_id,
         data.currency_to_name,
         data.currency_to_code,
         data.currency_to_symbol,
         data.amount,
         data.user_id,
         data.user_name,
         data.date,
         data.note
       );
     }).filter(Boolean);
   }
}