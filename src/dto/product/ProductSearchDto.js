// ProductSearchDto описывает структуру продукта для поиска (только необходимые поля)
export default class ProductSearchDto {
  constructor({
    id,
    type,
    name,
    description,
    sku,
    image,
    category_id,
    category_name,
    stock_quantity,
    unit_id,
    unit_name,
    unit_short_name,
    retail_price,
    wholesale_price,
    purchase_price,
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.sku = sku;
    this.image = image;
    this.category_id = category_id;
    this.category_name = category_name;
    this.stock_quantity = stock_quantity;
    this.unit_id = unit_id;
    this.unit_name = unit_name;
    this.unit_short_name = unit_short_name;
    this.retail_price = retail_price;
    this.wholesale_price = wholesale_price;
    this.purchase_price = purchase_price;
  }

  typeName() {
    return Boolean(this.type) ? "product" : "service";
  }

  icons() {
    if (this.typeName() === "product") {
      return '<i class="fas fa-box text-[#3571A4] mr-2" title="Товар"></i>';
    } else {
      return '<i class="fas fa-concierge-bell text-[#3571A4] mr-2" title="Услуга"></i>';
    }
  }

  imgUrl() {
    if (this.image && this.image.length > 0) {
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.image}`;
    }
    return null;
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
  }

  static fromApi(data) {
    if (!data) return null;
    
    return new ProductSearchDto({
      id: data.id,
      type: data.type,
      name: data.name,
      description: data.description,
      sku: data.sku,
      image: data.image,
      category_id: data.category_id,
      category_name: data.category_name,
      stock_quantity: data.stock_quantity,
      unit_id: data.unit_id,
      unit_name: data.unit_name,
      unit_short_name: data.unit_short_name,
      retail_price: data.retail_price,
      wholesale_price: data.wholesale_price,
      purchase_price: data.purchase_price,
    });
  }
}
