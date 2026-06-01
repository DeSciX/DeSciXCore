"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsE401 = void 0;
var GetAddressBalanceUTXOsE401 = (function () {
    function GetAddressBalanceUTXOsE401() {
    }
    GetAddressBalanceUTXOsE401.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsE401.attributeTypeMap;
    };
    GetAddressBalanceUTXOsE401.discriminator = undefined;
    GetAddressBalanceUTXOsE401.attributeTypeMap = [
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
    return GetAddressBalanceUTXOsE401;
}());
exports.GetAddressBalanceUTXOsE401 = GetAddressBalanceUTXOsE401;
//# sourceMappingURL=getAddressBalanceUTXOsE401.js.map