"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaE400 = void 0;
var GetAddressBalanceKaspaE400 = (function () {
    function GetAddressBalanceKaspaE400() {
    }
    GetAddressBalanceKaspaE400.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaE400.attributeTypeMap;
    };
    GetAddressBalanceKaspaE400.discriminator = undefined;
    GetAddressBalanceKaspaE400.attributeTypeMap = [
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
    return GetAddressBalanceKaspaE400;
}());
exports.GetAddressBalanceKaspaE400 = GetAddressBalanceKaspaE400;
//# sourceMappingURL=getAddressBalanceKaspaE400.js.map