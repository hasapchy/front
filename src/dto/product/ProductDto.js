import { formatNumber } from "@/utils/numberUtils";
import { getImageUrl, createFromApiArray, normalizeNumber } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

/**
 * DTO для товара или услуги
 * @class ProductDto
 * @extends BaseDto
 */
export default class ProductDto extends BaseDto {
  /**
   * Создает экземпляр ProductDto
   * @param {Object} params - Параметры товара/услуги
   * @param {number} params.id - ID товара/услуги
   * @param {number} params.type - Тип (1 - товар, 2 - услуга)
   * @param {string} params.name - Название
   * @param {string} params.description - Описание
   * @param {string} params.sku - Артикул
   * @param {string|null} params.image - Путь к изображению
   * @param {number|null} params.category_id - ID основной категории
   * @param {string} params.category_name - Название основной категории
   * @param {Array} params.categories - Массив категорий
   * @param {number} params.stock_quantity - Количество на складе
   * @param {number} params.unit_id - ID единицы измерения
   * @param {string} params.unit_name - Название единицы измерения
   * @param {string} params.unit_short_name - Короткое название единицы измерения
   * @param {string|null} params.barcode - Штрих-код
   * @param {boolean} params.is_serialized - Является ли товар серийным
   * @param {string} params.date - Дата
   * @param {string} params.creator - Создатель
   * @param {string} params.created_at - Дата создания
   * @param {string} params.updated_at - Дата обновления
   * @param {number|null} params.retail_price - Розничная цена
   * @param {number|null} params.wholesale_price - Оптовая цена
   * @param {number|null} params.purchase_price - Закупочная цена
   */
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
    barcode,
    is_serialized,
    date,
    creator,
    created_at,
    updated_at,
    retail_price,
    wholesale_price,
    purchase_price
  }) {
    super();
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.sku = sku;
    this.image = image;
    this.categoryId = category_id;
    this.categoryName = category_name;
    this.categories = categories;
    this.stockQuantity = stock_quantity;
    this.unitId = unit_id;
    this.unitName = unit_name;
    this.unitShortName = unit_short_name;
    this.barcode = barcode;
    this.isSerialized = is_serialized;
    this.date = date;
    this.creator = creator;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.retailPrice = retail_price;
    this.wholesalePrice = wholesale_price;
    this.purchasePrice = purchase_price;
  }

  /**
   * Получить название типа товара
   * @returns {string} "product" для товара, "service" для услуги
   */
  typeName() {
    return this.type == 1 ? "product" : "service";
  }

  /**
   * Получить HTML иконку для товара/услуги
   * @returns {string} HTML строка с иконкой
   */
  icons() {
    if (this.typeName() === "product") {
      return '<i class="fas fa-box text-[#3571A4] mr-2" title="Товар"></i>';
    } else {
      return '<i class="fas fa-concierge-bell text-[#3571A4] mr-2" title="Услуга"></i>';
    }
  }

  /**
   * Получить отформатированную розничную цену
   * @returns {string} Отформатированная розничная цена
   */
  retailPriceFormatted() {
    let price = this.retailPrice;
    return this.priceFormatted(price);
  }

  /**
   * Получить отформатированную оптовую цену
   * @returns {string} Отформатированная оптовая цена
   */
  wholesalePriceFormatted() {
    let price = this.wholesalePrice;
    return this.priceFormatted(price);
  }

  /**
   * Форматирует цену
   * @param {number|null} price - Цена для форматирования
   * @returns {string} Отформатированная цена или пустая строка
   */
  priceFormatted(price) {
    const normalizedPrice = normalizeNumber(price);
    if (normalizedPrice === undefined) return "";
    return formatNumber(normalizedPrice, null, true);
  }

  /**
   * Получить URL изображения товара
   * @returns {string|null} URL изображения или null
   */
  imgUrl() {
    return getImageUrl(this.image);
  }

  /**
   * Получить основную категорию
   * @returns {Object|null} Объект основной категории или null
   */
  getPrimaryCategory() {
    return this.categories[0] ?? null;
  }

  /**
   * Получить вторичные категории (все кроме основной)
   * @returns {Array} Массив вторичных категорий
   */
  getSecondaryCategories() {
    return this.categories.slice(1);
  }

  /**
   * Получить список названий всех категорий через запятую
   * @returns {string} Строка с названиями категорий
   */
  getCategoryNames() {
    return this.categories.map(cat => cat.name).join(', ');
  }

  /**
   * Проверить, принадлежит ли товар к указанной категории
   * @param {number} categoryId - ID категории
   * @returns {boolean} true, если товар принадлежит категории
   */
  hasCategory(categoryId) {
    return this.categories.some(cat => cat.id == categoryId);
  }

  /**
   * Получить отображаемое название категории
   * @returns {string} Название основной категории или categoryName
   */
  getCategoryDisplayName() {
    const primary = this.getPrimaryCategory();
    return primary ? primary.name : (this.categoryName ?? '');
  }

  /**
   * Создает массив экземпляров ProductDto из массива данных API
   * @param {Array} dataArray - Массив объектов товаров/услуг из API
   * @returns {Array<ProductDto>} Массив экземпляров ProductDto
   */
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ProductDto({
        id: data.id,
        type: data.type,
        name: data.name,
        description: data.description,
        sku: data.sku,
        image: data.image,
        category_id: data.category_id,
        category_name: data.category_name,
        categories: data.categories ?? [],
        stock_quantity: data.stock_quantity ?? 0,
        unit_id: data.unit_id,
        unit_name: data.unit_name,
        unit_short_name: data.unit_short_name,
        barcode: data.barcode,
        is_serialized: data.is_serialized,
        date: data.date,
        creator: data.creator,
        created_at: data.created_at,
        updated_at: data.updated_at,
        retail_price: data.retail_price,
        wholesale_price: data.wholesale_price,
        purchase_price: data.purchase_price,
      });
    });
  }
}
