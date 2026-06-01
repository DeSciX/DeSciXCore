"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsE403 = void 0;
var ListSupportedAssetsE403 = (function () {
    function ListSupportedAssetsE403() {
    }
    ListSupportedAssetsE403.getAttributeTypeMap = function () {
        return ListSupportedAssetsE403.attributeTypeMap;
    };
    ListSupportedAssetsE403.discriminator = undefined;
    ListSupportedAssetsE403.attributeTypeMap = [
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
    return ListSupportedAssetsE403;
}());
exports.ListSupportedAssetsE403 = ListSupportedAssetsE403;
//# sourceMappingURL=listSupportedAssetsE403.js.map