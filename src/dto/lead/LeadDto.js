export default class LeadDto {
  /**
   * @param {object} data
   */
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.companyId = data.company_id ?? null;
    this.creatorId = data.creator_id ?? null;
    this._sendResponsible = Object.prototype.hasOwnProperty.call(data, "responsible_id");
    this.responsibleId = data.responsible_id ?? null;
    this.clientId = data.client_id ?? null;
    this.leadSourceId = data.lead_source_id ?? null;
    this.statusId = data.status_id ?? null;
    this.comment = data.comment ?? null;
    this.orderId = data.order_id ?? null;
    this.createdAt = data.created_at ?? null;
    this.updatedAt = data.updated_at ?? null;
    this.client = data.client ?? null;
    this.status = data.status ?? null;
    this.source = data.source ?? null;
    this.responsible = data.responsible ?? null;
  }

  /**
   * @param {object} data
   * @returns {LeadDto}
   */
  static fromApi(data) {
    return new LeadDto(data);
  }

  /**
   * @param {object[]} rows
   * @returns {LeadDto[]}
   */
  static fromApiArray(rows) {
    return (rows || []).map((r) => LeadDto.fromApi(r));
  }

  /**
   * @returns {object}
   */
  toApiPayload() {
    const payload = {};
    if (this.clientId != null) payload.client_id = this.clientId;
    if (this.leadSourceId != null) payload.lead_source_id = this.leadSourceId;
    if (this.statusId != null) payload.status_id = this.statusId;
    if (this.comment != null) payload.comment = this.comment;
    if (this._sendResponsible) payload.responsible_id = this.responsibleId;
    return payload;
  }
}
