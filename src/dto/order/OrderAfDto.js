export default class OrderAfDto {
  constructor(
    id,
    name = "",
    type = "",
    options = [],
    required = false,
    defaultValue = null,
    userId = null,
    categories = [],
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.options = options;
    this.required = required;
    this.defaultValue = defaultValue;
    this.userId = userId;
    this.categories = categories;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isText() {
    return this.type === 'string';
  }

  isNumber() {
    return this.type === 'int';
  }

  isDate() {
    return this.type === 'date';
  }

  isDatetime() {
    return this.type === 'datetime';
  }

  isBoolean() {
    return this.type === 'boolean';
  }

  isSelect() {
    return this.type === 'select';
  }

  getTypeLabel() {
    const typeLabels = {
      'string': 'Текст',
      'int': 'Число',
      'date': 'Дата',
      'datetime': 'Дата и время',
      'boolean': 'Да/Нет',
      'select': 'Выбор из списка'
    };
    return typeLabels[this.type] || this.type;
  }

  getOptions() {
    return this.options || [];
  }

  getCategoryNames() {
    if (!this.categories || this.categories.length === 0) {
      return 'Все категории';
    }
    return this.categories.map(cat => cat.name).join(', ');
  }

  isAvailableForCategory(categoryId) {
    if (!this.categories || this.categories.length === 0) {
      return true;
    }
    return this.categories.some(cat => cat.id === categoryId);
  }

  getDefaultValue() {
    if (this.type === 'boolean') {
      return this.defaultValue === '1' || this.defaultValue === true;
    }
    return this.defaultValue;
  }

  getFormHtml() {
    switch (this.type) {
      case 'string':
        return `<input type="text" class="form-control" name="additional_field_${this.id}" value="${this.defaultValue || ''}" ${this.required ? 'required' : ''} />`;
      
      case 'int':
        return `<input type="number" class="form-control" name="additional_field_${this.id}" value="${this.defaultValue || ''}" ${this.required ? 'required' : ''} />`;
      
      case 'date':
        return `<input type="date" class="form-control" name="additional_field_${this.id}" value="${this.defaultValue || ''}" ${this.required ? 'required' : ''} />`;
      
      case 'datetime':
        return `<input type="datetime-local" class="form-control" name="additional_field_${this.id}" value="${this.defaultValue || ''}" ${this.required ? 'required' : ''} />`;
      
      case 'boolean':
        const checked = this.defaultValue === '1' || this.defaultValue === true ? 'checked' : '';
        return `<input type="checkbox" class="form-check-input" name="additional_field_${this.id}" value="1" ${checked} ${this.required ? 'required' : ''} />`;
      
      case 'select':
        let optionsHtml = '<option value="">Выберите...</option>';
        this.options.forEach(option => {
          const selected = option === this.defaultValue ? 'selected' : '';
          optionsHtml += `<option value="${option}" ${selected}>${option}</option>`;
        });
        return `<select class="form-select" name="additional_field_${this.id}" ${this.required ? 'required' : ''}>${optionsHtml}</select>`;
      
      default:
        return `<input type="text" class="form-control" name="additional_field_${this.id}" value="${this.defaultValue || ''}" ${this.required ? 'required' : ''} />`;
    }
  }

  static fromApi(data) {
    return new OrderAfDto(
      data.id,
      data.name,
      data.type,
      data.options || [],
      data.required || false,
      data.default || null,
      data.user_id,
      data.categories || [],
      data.created_at,
      data.updated_at
    );
  }

  static fromApiArray(dataArray) {
    return (dataArray || []).map(item => OrderAfDto.fromApi(item));
  }
}

