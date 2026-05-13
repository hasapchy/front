export default class LeadDto {
  static clientFromApi(raw) {
    if (raw == null || typeof raw !== 'object') {
      return null;
    }
    return {
      id: raw.id == null ? null : Number(raw.id),
      firstName: raw.first_name == null ? '' : String(raw.first_name),
      lastName: raw.last_name == null ? '' : String(raw.last_name),
    };
  }

  /**
   * @param {object} data
   */
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.companyId = data.company_id ?? null;
    this.creatorId = data.creator_id ?? null;
    this._sendTitle = Object.prototype.hasOwnProperty.call(data, "title");
    this.title = data.title == null || data.title === "" ? null : String(data.title);
    this._sendResponsible = Object.prototype.hasOwnProperty.call(data, "responsible_id");
    this.responsibleId = data.responsible_id ?? null;
    this._sendFiles = Object.prototype.hasOwnProperty.call(data, "files");
    this.files = Array.isArray(data.files) ? [...data.files] : [];
    this.clientId = data.client_id ?? null;
    this.leadSourceId = data.lead_source_id ?? null;
    this.statusId = data.status_id ?? null;
    this.comment = data.comment ?? null;
    this.orderId = data.order_id ?? null;
    this.createdAt = data.created_at ?? null;
    this.updatedAt = data.updated_at ?? null;
    this.date = data.date ?? data.created_at ?? null;
    this.client = LeadDto.clientFromApi(data.client);
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
    if (this._sendTitle) {
      payload.title = this.title;
    }
    if (this.leadSourceId != null) payload.lead_source_id = this.leadSourceId;
    if (this.statusId != null) payload.status_id = this.statusId;
    if (this.comment != null) payload.comment = this.comment;
    if (this._sendFiles) payload.files = this.files;
    if (this._sendResponsible) payload.responsible_id = this.responsibleId;
    return payload;
  }
}
