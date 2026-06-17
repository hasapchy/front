import { createFromApiArray } from "@/utils/dtoUtils";

class UnitDto {
    constructor(id, name, shortName) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
    }
    
    static fromApi(data) {
        if (!data) {
            return null;
        }
        return new UnitDto(data.id, data.name, data.short_name);
    }

    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, UnitDto.fromApi).filter(Boolean);
    }
}

export default UnitDto;