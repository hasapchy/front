import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

export default class CategoryDto extends BaseDto {
    constructor(id, name, parentId = null, parentName = null, userId = null, userName = null, users = [], createdAt = '', updatedAt = '') {
        super();
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.parentName = parentName;
        this.userId = userId;
        this.userName = userName;
        this.users = users;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    getUserIds() {
        return getUserIdsFromArray(this.users);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new CategoryDto(
                data.id,
                data.name,
                data.parent_id,
                data.parent_name,
                data.user_id,
                data.user_name,
                data.users ?? [],
                data.created_at,
                data.updated_at
            );
        });
    }
}