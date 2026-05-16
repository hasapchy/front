import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";

export default class UserSearchDto {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.surname = data.surname;
    this.email = data.email ?? "";
    this.position = data.position ?? "";
    this.photo = data.photo;
    this.isActive = data.is_active === undefined ? true : Number(data.is_active) === 1;
  }

  photoUrl() {
    return getImageUrl(this.photo);
  }

  /**
   * @param {object|null} data
   * @returns {UserSearchDto|null}
   */
  static fromApi(data) {
    if (!data) return null;
    return new UserSearchDto(data);
  }

  /**
   * @param {object[]} dataArray
   * @returns {UserSearchDto[]}
   */
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, UserSearchDto.fromApi);
  }
}
