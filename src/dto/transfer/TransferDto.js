import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

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

    amountDescription() {
        var res = '<i class="fas fa-right-long text-[#EE4F47] mr-2"></i>';
        res += `<span class="font-semibold">${this.amount} ${this.currencyFromSymbol}</span>`;
        res += '<i class="fas fa-right-long text-[#5CB85C] ml-2"></i>';
        return res;
    }

    formatDate() {
     return dayjsDateTime(this.date);
   }
}