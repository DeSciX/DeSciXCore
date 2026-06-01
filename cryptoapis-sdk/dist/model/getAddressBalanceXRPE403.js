"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRPE403 = void 0;
var GetAddressBalanceXRPE403 = (function () {
    function GetAddressBalanceXRPE403() {
    }
    GetAddressBalanceXRPE403.getAttributeTypeMap = function () {
        return GetAddressBalanceXRPE403.attributeTypeMap;
    };
    GetAddressBalanceXRPE403.discriminator = undefined;
    GetAddressBalanceXRPE403.attributeTypeMap = [
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
    return GetAddressBalanceXRPE403;
}());
exports.GetAddressBalanceXRPE403 = GetAddressBalanceXRPE403;
//# sourceMappingURL=getAddressBalanceXRPE403.js.map