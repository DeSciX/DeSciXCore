"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriNotFound = void 0;
var UriNotFound = (function () {
    function UriNotFound() {
    }
    UriNotFound.getAttributeTypeMap = function () {
        return UriNotFound.attributeTypeMap;
    };
    UriNotFound.discriminator = undefined;
    UriNotFound.attributeTypeMap = [
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
    return UriNotFound;
}());
exports.UriNotFound = UriNotFound;
//# sourceMappingURL=uriNotFound.js.map