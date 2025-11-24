import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

/**
 * DTO для товара в заказе
 * @class OrderProductDto
 */
export default class OrderProductDto {
  /**
   * Создает экземпляр OrderProductDto
   * @param {number} id - ID записи товара в заказе
   * @param {number} orderId - ID заказа
   * @param {number} productId - ID товара
   * @param {string} productName - Название товара
   * @param {string|null} productImage - Путь к изображению товара
   * @param {number} unitId - ID единицы измерения
   * @param {string} unitName - Название единицы измерения
   * @param {string} unitShortName - Короткое название единицы измерения
   * @param {number} quantity - Количество
   * @param {number} price - Цена за единицу
   * @param {number|null} width - Ширина (для расчета площади/периметра)
   * @param {number|null} height - Высота (для расчета площади/периметра)
   */
  constructor(
    id,
    orderId,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    quantity,
    price,
    width = null,
    height = null
  ) {
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.productName = productName;
    this.productImage = productImage;
    this.unitId = unitId;
    this.unitName = unitName;
    this.unitShortName = unitShortName;
    this.quantity = quantity;
    this.price = price;
    this.width = width;
    this.height = height;
    this.type = null;
  }

  /**
   * Создает экземпляр OrderProductDto из ProductDto
   * @param {Object} productDto - Объект ProductDto
   * @param {boolean} def - Установить количество по умолчанию (1) или 0
   * @returns {OrderProductDto} Экземпляр OrderProductDto
   */
  static fromProductDto(productDto, def = false) {
    const dto = new OrderProductDto(
      null,
      null,
      productDto.id,
      productDto.name,
      productDto.image,
      productDto.unitId,
      productDto.unitName,
      productDto.unitShortName,
      def ? 1 : 0,
      0
    );
    dto.type = productDto.type;
    dto.retailPrice = productDto.retailPrice;
    dto.wholesalePrice = productDto.wholesalePrice;
    return dto;
  }

  /**
   * Получить URL изображения товара
   * @returns {string|null} URL изображения или null
   */
  imgUrl() {
    return getImageUrl(this.productImage);
  }

  /**
   * Создает массив экземпляров OrderProductDto из массива данных API
   * @param {Array} dataArray - Массив объектов товаров в заказе из API
   * @returns {Array<OrderProductDto>} Массив экземпляров OrderProductDto
   */
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const dto = new OrderProductDto(
        data.id,
        data.order_id,
        data.product_id,
        data.product_name,
        data.product_image,
        data.unit_id,
        data.unit_name,
        data.unit_short_name,
        data.quantity,
        data.price,
        data.width,
        data.height
      );
      dto.type = data.type || (data.product ? data.product.type : null);
      return dto;
    });
  }
}
