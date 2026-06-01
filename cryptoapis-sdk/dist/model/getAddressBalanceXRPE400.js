"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRPE400 = void 0;
var GetAddressBalanceXRPE400 = (function () {
    function GetAddressBalanceXRPE400() {
    }
    GetAddressBalanceXRPE400.getAttributeTypeMap = function () {
        return GetAddressBalanceXRPE400.attributeTypeMap;
    };
    GetAddressBalanceXRPE400.discriminator = undefined;
    GetAddressBalanceXRPE400.attributeTypeMap = [
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
    return GetAddressBalanceXRPE400;
}());
exports.GetAddressBalanceXRPE400 = GetAddressBalanceXRPE400;
//# sourceMappingURL=getAddressBalanceXRPE400.js.map