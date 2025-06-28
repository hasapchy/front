import OrderStatusCategoryDto from '@/dto/order/OrderStatusCategoryDto';

export default class OrderStatusDto {
    /**
     * @param {number} id
     * @param {string} name
     * @param {number} categoryId
     * @param {OrderStatusCategoryDto|null} categoryDto
     */
    constructor(id, name, categoryId, categoryDto = null) {
        this.id = id;
        this.name = name;
        this.categoryId = categoryId;
        this.category = categoryDto;
    }
}
