class UnitDto {
    constructor(id, name, short_name, calc_area) {
        this.id = id;
        this.name = name;
        this.short_name = short_name;
        this.calc_area = calc_area;
    }
    
    static fromJsonArray(jsonArray) {
        return (jsonArray || []).map(json => UnitDto.fromJson(json));
    }
}

export default UnitDto;