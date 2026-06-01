"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsE403 = void 0;
var GetAddressBalanceUTXOsE403 = (function () {
    function GetAddressBalanceUTXOsE403() {
    }
    GetAddressBalanceUTXOsE403.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsE403.attributeTypeMap;
    };
    GetAddressBalanceUTXOsE403.discriminator = undefined;
    GetAddressBalanceUTXOsE403.attributeTypeMap = [
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
    return GetAddressBalanceUTXOsE403;
}());
exports.GetAddressBalanceUTXOsE403 = GetAddressBalanceUTXOsE403;
//# sourceMappingURL=getAddressBalanceUTXOsE403.js.map