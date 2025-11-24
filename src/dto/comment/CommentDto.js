import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

/**
 * DTO для комментариев к различным сущностям (заказы, транзакции и т.д.)
 * @class CommentDto
 * @extends BaseDto
 */
export default class CommentDto extends BaseDto {
  /**
   * Создает экземпляр CommentDto
   * @param {Object} params - Параметры комментария
   * @param {number} params.id - ID комментария
   * @param {string} params.body - Текст комментария
   * @param {string} params.commentable_type - Тип сущности, к которой привязан комментарий
   * @param {number} params.commentable_id - ID сущности, к которой привязан комментарий
   * @param {number} params.user_id - ID пользователя, создавшего комментарий
   * @param {string} params.created_at - Дата создания
   * @param {string} params.updated_at - Дата обновления
   * @param {Object|null} params.user - Объект пользователя
   * @param {number} params.user.id - ID пользователя
   * @param {string} params.user.name - Имя пользователя
   * @param {string} params.user.email - Email пользователя
   */
  constructor({
    id,
    body,
    commentable_type,
    commentable_id,
    user_id,
    created_at,
    updated_at,
    user = null
  }) {
    super();
    this.id = id;
    this.body = body;
    this.commentableType = commentable_type;
    this.commentableId = commentable_id;
    this.userId = user_id;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.user = user ? {
      id: user.id,
      name: user.name,
      email: user.email
    } : null;
  }

  /**
   * Получить имя пользователя, создавшего комментарий
   * @returns {string} Имя пользователя или "Неизвестный пользователь"
   */
  getUserName() {
    return this.user?.name || 'Неизвестный пользователь';
  }

  /**
   * Получить email пользователя, создавшего комментарий
   * @returns {string} Email пользователя или пустая строка
   */
  getUserEmail() {
    return this.user?.email || '';
  }

  /**
   * Создает массив экземпляров CommentDto из массива данных API
   * @param {Array} dataArray - Массив объектов комментариев из API
   * @returns {Array<CommentDto>} Массив экземпляров CommentDto
   */
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new CommentDto({
        id: data.id,
        body: data.body,
        commentable_type: data.commentable_type,
        commentable_id: data.commentable_id,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user: data.user
      });
    });
  }
}

