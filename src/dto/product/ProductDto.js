import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
class ProductDto {
  constructor({
    id,
    type,
    name,
    description,
    sku,
    image,
    category_id,
    category_name,
    categories = [],
    stock_quantity,
    unit_id,
    unit_name,
    unit_short_name,
    unit_calc_area,
    barcode,
    is_serialized,
    created_at,
    updated_at,
    retail_price,
    wholesale_price,
    purchase_price,
    // currency_id,
    // currency_name,
    // currency_code,
    // currency_symbol
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.sku = sku;
    this.image = image;
    this.category_id = category_id; // Для обратной совместимости
    this.category_name = category_name; // Для обратной совместимости
    this.categories = categories; // Массив категорий
    this.stock_quantity = stock_quantity;
    this.unit_id = unit_id;
    this.unit_name = unit_name;
    this.unit_short_name = unit_short_name;
    this.unit_calc_area = unit_calc_area;
    this.barcode = barcode;
    this.is_serialized = is_serialized;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.retail_price = retail_price;
    this.wholesale_price = wholesale_price;
    this.purchase_price = purchase_price;
    // this.currency_id = currency_id;
    // this.currency_name = currency_name;
    // this.currency_code = currency_code;
    // this.currency_symbol = currency_symbol;
  }

  typeName() {
    return Boolean(this.type) ? "product" : "service";
  }
  formatDate() {
    return dayjsDateTime(this.date);
  }

  icons() {
    if (this.typeName() === "product") {
      return '<i class="fas fa-box text-[#3571A4] mr-2" title="Товар"></i>';
    } else {
      return '<i class="fas fa-concierge-bell text-[#3571A4] mr-2" title="Услуга"></i>';
    }
  }



  retailPriceFormatted() {
    let price = this.retail_price;
    return this.priceFormatted(price);
  }

  wholesalePriceFormatted() {
    let price = this.wholesale_price;
    return this.priceFormatted(price);
  }

  priceFormatted(price) {
    if (typeof price !== "number") {
      price = parseFloat(price);
    }
    return isNaN(price) ? "" : price.toFixed(2).replace(/\.0+$/, "");
    // + ' ' + (this.currency_symbol || '')
  }

  imgUrl() {
    if (this.image && this.image.length > 0) {
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.image}`;
    }
    return null;
  }

  // Методы для работы с множественными категориями
  getPrimaryCategory() {
    // Первая категория считается основной
    return this.categories[0] || null;
  }

  getSecondaryCategories() {
    // Все категории кроме первой считаются дополнительными
    return this.categories.slice(1);
  }

  getCategoryNames() {
    return this.categories.map(cat => cat.name).join(', ');
  }

  hasCategory(categoryId) {
    return this.categories.some(cat => cat.id == categoryId);
  }

  getCategoryDisplayName() {
    // Для обратной совместимости возвращаем основную категорию или первую
    const primary = this.getPrimaryCategory();
    return primary ? primary.name : (this.category_name || '');
  }

  static fromApi(data) {
    if (!data) return null;
    
    return new ProductDto({
      id: data.id,
      type: data.type,
      name: data.name,
      description: data.description,
      sku: data.sku,
      image: data.image,
      category_id: data.category_id,
      category_name: data.category_name,
      categories: data.categories || [],
      stock_quantity: data.stock_quantity,
      unit_id: data.unit_id,
      unit_name: data.unit_name,
      unit_short_name: data.unit_short_name,
      unit_calc_area: data.unit_calc_area,
      barcode: data.barcode,
      is_serialized: data.is_serialized,
      created_at: data.created_at,
      updated_at: data.updated_at,
      retail_price: data.retail_price,
      wholesale_price: data.wholesale_price,
      purchase_price: data.purchase_price,
    });
  }
}
export default ProductDto;
