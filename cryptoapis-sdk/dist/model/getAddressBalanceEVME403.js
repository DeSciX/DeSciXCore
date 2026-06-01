"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVME403 = void 0;
var GetAddressBalanceEVME403 = (function () {
    function GetAddressBalanceEVME403() {
    }
    GetAddressBalanceEVME403.getAttributeTypeMap = function () {
        return GetAddressBalanceEVME403.attributeTypeMap;
    };
    GetAddressBalanceEVME403.discriminator = undefined;
    GetAddressBalanceEVME403.attributeTypeMap = [
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
    return GetAddressBalanceEVME403;
}());
exports.GetAddressBalanceEVME403 = GetAddressBalanceEVME403;
//# sourceMappingURL=getAddressBalanceEVME403.js.map