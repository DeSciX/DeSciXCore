"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsE400 = void 0;
var GetAddressBalanceUTXOsE400 = (function () {
    function GetAddressBalanceUTXOsE400() {
    }
    GetAddressBalanceUTXOsE400.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsE400.attributeTypeMap;
    };
    GetAddressBalanceUTXOsE400.discriminator = undefined;
    GetAddressBalanceUTXOsE400.attributeTypeMap = [
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
    return GetAddressBalanceUTXOsE400;
}());
exports.GetAddressBalanceUTXOsE400 = GetAddressBalanceUTXOsE400;
//# sourceMappingURL=getAddressBalanceUTXOsE400.js.map