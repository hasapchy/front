import DriveFolderDto from "./DriveFolderDto";
import DriveFileDto from "./DriveFileDto";

export default class DriveListingDto {
  constructor(parent, folders, files, breadcrumbs) {
    this.parent = parent;
    this.folders = folders;
    this.files = files;
    this.breadcrumbs = breadcrumbs;
  }

  static fromApi(data) {
    if (!data) {
      return new DriveListingDto(null, [], [], []);
    }
    return new DriveListingDto(
      data.parent ? DriveFolderDto.fromApi(data.parent) : null,
      DriveFolderDto.fromApiArray(data.folders ?? []),
      DriveFileDto.fromApiArray(data.files ?? []),
      Array.isArray(data.breadcrumbs) ? data.breadcrumbs : []
    );
  }
}
