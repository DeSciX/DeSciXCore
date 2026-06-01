"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRPE401 = void 0;
var GetAddressBalanceXRPE401 = (function () {
    function GetAddressBalanceXRPE401() {
    }
    GetAddressBalanceXRPE401.getAttributeTypeMap = function () {
        return GetAddressBalanceXRPE401.attributeTypeMap;
    };
    GetAddressBalanceXRPE401.discriminator = undefined;
    GetAddressBalanceXRPE401.attributeTypeMap = [
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
    return GetAddressBalanceXRPE401;
}());
exports.GetAddressBalanceXRPE401 = GetAddressBalanceXRPE401;
//# sourceMappingURL=getAddressBalanceXRPE401.js.map