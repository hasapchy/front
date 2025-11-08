import OrderAfDto from './OrderAfDto';
import { createFromApiArray } from "@/utils/dtoUtils";
import { dtoDateFormatters } from "@/utils/dateUtils";

export default class OrderAfValueDto {
  constructor(
    id,
    orderId,
    fieldId,
    value = "",
    field = null,
    formattedValue = "",
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.orderId = orderId;
    this.fieldId = fieldId;
    this.value = value;
    this.field = field;
    this.formattedValue = formattedValue;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getDisplayValue() {
    if (this.formattedValue) {
      return this.formattedValue;
    }

    if (!this.field) {
      return this.value;
    }

    switch (this.field.type) {
      case 'date':
        return this.formatDate(this.value);
      case 'datetime':
        return this.formatDateTime(this.value);
      case 'boolean':
        return this.value == 1 ? 'Да' : 'Нет';
      case 'select':
        return this.value;
      default:
        return this.value;
    }
  }

  formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch (e) {
      return dateString;
    }
  }

  formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    return dtoDateFormatters.formatDate(dateTimeString);
  }

  getFieldName() {
    return this.field ? this.field.name : `Поле ${this.fieldId}`;
  }

  getFieldType() {
    return this.field ? this.field.type : 'unknown';
  }

  isRequired() {
    return this.field ? this.field.required : false;
  }

  getFormHtml() {
    if (!this.field) {
      return `<input type="text" class="form-control" name="additional_field_${this.fieldId}" value="${this.value}" />`;
    }

    const fieldDto = new OrderAfDto(
      this.field.id,
      this.field.name,
      this.field.type,
      this.field.options || [],
      this.field.required || false,
      this.value,
      this.field.user_id,
      this.field.categories || []
    );

    return fieldDto.getFormHtml();
  }

  getDisplayHtml() {
    const fieldName = this.getFieldName();
    const displayValue = this.getDisplayValue();
    const required = this.isRequired();

    return `
      <div class="additional-field-item">
        <label class="form-label ${required ? 'required' : ''}">
          ${fieldName}${required ? ' *' : ''}
        </label>
        <div class="field-value">
          ${displayValue}
        </div>
      </div>
    `;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const field = data.field ? OrderAfDto.fromApiArray([data.field])[0] || null : null;
      
      return new OrderAfValueDto(
        data.id,
        data.order_id,
        data.order_af_id,
        data.value,
        field,
        data.formatted_value || data.value,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }

  static fromFormData(fieldId, value) {
    return new OrderAfValueDto(
      null,
      null,
      fieldId,
      value
    );
  }
}

