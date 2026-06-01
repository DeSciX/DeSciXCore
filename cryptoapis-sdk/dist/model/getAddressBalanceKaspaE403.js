"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaE403 = void 0;
var GetAddressBalanceKaspaE403 = (function () {
    function GetAddressBalanceKaspaE403() {
    }
    GetAddressBalanceKaspaE403.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaE403.attributeTypeMap;
    };
    GetAddressBalanceKaspaE403.discriminator = undefined;
    GetAddressBalanceKaspaE403.attributeTypeMap = [
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
    return GetAddressBalanceKaspaE403;
}());
exports.GetAddressBalanceKaspaE403 = GetAddressBalanceKaspaE403;
//# sourceMappingURL=getAddressBalanceKaspaE403.js.map