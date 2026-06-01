"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRequestBodyStructure = void 0;
var InvalidRequestBodyStructure = (function () {
    function InvalidRequestBodyStructure() {
    }
    InvalidRequestBodyStructure.getAttributeTypeMap = function () {
        return InvalidRequestBodyStructure.attributeTypeMap;
    };
    InvalidRequestBodyStructure.discriminator = undefined;
    InvalidRequestBodyStructure.attributeTypeMap = [
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
    return InvalidRequestBodyStructure;
}());
exports.InvalidRequestBodyStructure = InvalidRequestBodyStructure;
//# sourceMappingURL=invalidRequestBodyStructure.js.map