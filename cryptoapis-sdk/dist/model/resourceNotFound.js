"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceNotFound = void 0;
var ResourceNotFound = (function () {
    function ResourceNotFound() {
    }
    ResourceNotFound.getAttributeTypeMap = function () {
        return ResourceNotFound.attributeTypeMap;
    };
    ResourceNotFound.discriminator = undefined;
    ResourceNotFound.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ResourceNotFound;
}());
exports.ResourceNotFound = ResourceNotFound;
//# sourceMappingURL=resourceNotFound.js.map