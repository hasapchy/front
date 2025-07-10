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
    this.category_id = category_id;
    this.category_name = category_name;
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
    return this.type == 1 || this.type === "1" ? "product" : "service";
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

  imgUrl() {
    return this.image.length > 0
      ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.image}`
      : null;
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
}

export default ProductDto;
