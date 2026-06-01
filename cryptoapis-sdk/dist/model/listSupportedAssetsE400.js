"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsE400 = void 0;
var ListSupportedAssetsE400 = (function () {
    function ListSupportedAssetsE400() {
    }
    ListSupportedAssetsE400.getAttributeTypeMap = function () {
        return ListSupportedAssetsE400.attributeTypeMap;
    };
    ListSupportedAssetsE400.discriminator = undefined;
    ListSupportedAssetsE400.attributeTypeMap = [
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
    return ListSupportedAssetsE400;
}());
exports.ListSupportedAssetsE400 = ListSupportedAssetsE400;
//# sourceMappingURL=listSupportedAssetsE400.js.map