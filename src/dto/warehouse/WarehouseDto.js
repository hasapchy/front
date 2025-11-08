import { dtoDateFormatters } from "@/utils/dateUtils";
import { getUserIdsFromArray, createFromApiArray } from "@/utils/dtoUtils";

export default class WarehouseDto {
    constructor(id, name, users = [], createdAt = '', updatedAt = '') {
        this.id = id;
        this.name = name;
        this.users = users;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    formatCreatedAt() {
        return dtoDateFormatters.formatCreatedAt(this.createdAt);
    }

    getUserIds() {
        return getUserIdsFromArray(this.users);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new WarehouseDto(
                data.id,
                data.name,
                data.users || [],
                data.created_at,
                data.updated_at
            );
        }).filter(Boolean);
    }
}