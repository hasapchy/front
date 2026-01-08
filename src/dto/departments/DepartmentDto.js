import { createFromApiArray } from "@/utils/dtoUtils";
import { UserDto } from "@/dto/users/UserDto";

export class DepartmentDto {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.parentId = data.parent_id;
        this.headId = data.head_id;
        this.deputyHeadId = data.deputy_head_id;
        this.companyId = data.company_id;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;

        this.head = data.head ? new UserDto(data.head) : null;
        this.deputyHead = data.deputy_head ? new UserDto(data.deputy_head) : null;
        this.parent = data.parent ? new DepartmentDto(data.parent) : null;
        this.children = data.children ? DepartmentDto.fromApiArray(data.children) : [];
        this.users = data.users ? UserDto.fromApiArray(data.users) : [];
        this.users_count = data.users_count || (this.users ? this.users.length : 0);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, (data) => new DepartmentDto(data));
    }
}
