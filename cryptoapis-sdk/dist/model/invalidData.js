"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidData = void 0;
var InvalidData = (function () {
    function InvalidData() {
    }
    InvalidData.getAttributeTypeMap = function () {
        return InvalidData.attributeTypeMap;
    };
    InvalidData.discriminator = undefined;
    InvalidData.attributeTypeMap = [
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
    return InvalidData;
}());
exports.InvalidData = InvalidData;
//# sourceMappingURL=invalidData.js.map