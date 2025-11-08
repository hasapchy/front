import { createFromApiArray } from "@/utils/dtoUtils";

class UnitDto {
    constructor(id, name, shortName, calcArea) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.calcArea = calcArea;
    }
    
    static fromApiArray(dataArray) {
        return createFromApiArray(dataArray, data => {
            return new UnitDto(
                data.id,
                data.name,
                data.short_name,
                data.calc_area
            );
        }).filter(Boolean);
    }
}

export default UnitDto;