"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UploadImageDto {
    submissionId;
    fieldId;
    base64;
}
exports.UploadImageDto = UploadImageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client-generated submission UUID (used in the blob path)',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UploadImageDto.prototype, "submissionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Form field ID (used in the blob path)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadImageDto.prototype, "fieldId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Full data URL: "data:image/<mime>;base64,<data>". Max 10 MB decoded.',
        example: 'data:image/jpeg;base64,/9j/4AAQ...',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^data:image\/(jpeg|jpg|png|gif|webp|heic);base64,/, {
        message: 'base64 must be a valid image data URL (jpeg, png, gif, webp, or heic)',
    }),
    (0, class_validator_1.MaxLength)(14_000_000, { message: 'Image exceeds the 10 MB limit' }),
    __metadata("design:type", String)
], UploadImageDto.prototype, "base64", void 0);
//# sourceMappingURL=upload-image.dto.js.map