import { createFromApiArray } from "@/utils/dtoUtils";

class UnitDto {
    constructor(id, name, shortName) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
    }
    
    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new UnitDto(
                data.id,
                data.name,
                data.short_name
            );
        }).filter(Boolean);
    }
}

export default UnitDto;