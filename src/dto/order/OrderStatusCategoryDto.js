export default class OrderStatusCategoryDto {
    /**
     * @param {number} id
     * @param {string} name
     * @param {number} userId
     * @param {string} color
     */
    constructor(id, name, userId, color) {
        this.id = id;
        this.name = name;
        this.userId = userId;
        this.color = color;
    }
}