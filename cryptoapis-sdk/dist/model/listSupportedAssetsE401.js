"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsE401 = void 0;
var ListSupportedAssetsE401 = (function () {
    function ListSupportedAssetsE401() {
    }
    ListSupportedAssetsE401.getAttributeTypeMap = function () {
        return ListSupportedAssetsE401.attributeTypeMap;
    };
    ListSupportedAssetsE401.discriminator = undefined;
    ListSupportedAssetsE401.attributeTypeMap = [
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
    return ListSupportedAssetsE401;
}());
exports.ListSupportedAssetsE401 = ListSupportedAssetsE401;
//# sourceMappingURL=listSupportedAssetsE401.js.map