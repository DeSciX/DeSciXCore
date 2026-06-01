"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaE401 = void 0;
var GetAddressBalanceKaspaE401 = (function () {
    function GetAddressBalanceKaspaE401() {
    }
    GetAddressBalanceKaspaE401.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaE401.attributeTypeMap;
    };
    GetAddressBalanceKaspaE401.discriminator = undefined;
    GetAddressBalanceKaspaE401.attributeTypeMap = [
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
    return GetAddressBalanceKaspaE401;
}());
exports.GetAddressBalanceKaspaE401 = GetAddressBalanceKaspaE401;
//# sourceMappingURL=getAddressBalanceKaspaE401.js.map