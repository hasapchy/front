export default class ProjectBalanceHistoryDto {
  constructor(source, sourceId, date, amount, description) {
    this.source = source;
    this.sourceId = sourceId;
    this.date = date;
    this.amount = amount;
    this.description = description;
  }

  formatDate() {
    return this.date ? new Date(this.date).toLocaleString() : "";
  }

  formatAmountWithColor() {
    const val = parseFloat(this.amount);
    const color = val >= 0 ? "#5CB85C" : "#EE4F47";
    return `<span style="color:${color};font-weight:bold">${val.toFixed(
      2
    )}</span>`;
  }
}
