"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidPagination = void 0;
var InvalidPagination = (function () {
    function InvalidPagination() {
    }
    InvalidPagination.getAttributeTypeMap = function () {
        return InvalidPagination.attributeTypeMap;
    };
    InvalidPagination.discriminator = undefined;
    InvalidPagination.attributeTypeMap = [
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
    return InvalidPagination;
}());
exports.InvalidPagination = InvalidPagination;
//# sourceMappingURL=invalidPagination.js.map