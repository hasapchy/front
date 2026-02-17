import { dtoDateFormatters } from "@/utils/dateUtils";
import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";

export default class CategoryDto {
    constructor(id, name, parentId = null, parentName = null, userId = null, userName = null, users = [], createdAt = '', updatedAt = '') {
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

    formatCreatedAt() {
        return dtoDateFormatters.formatCreatedAt(this.createdAt);
    }

    formatUpdatedAt() {
        return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
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
                data.creator_id,
                data.user_name,
                data.users || [],
                data.created_at,
                data.updated_at
            );
        }).filter(Boolean);
    }
}