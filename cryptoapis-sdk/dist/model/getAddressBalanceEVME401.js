"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVME401 = void 0;
var GetAddressBalanceEVME401 = (function () {
    function GetAddressBalanceEVME401() {
    }
    GetAddressBalanceEVME401.getAttributeTypeMap = function () {
        return GetAddressBalanceEVME401.attributeTypeMap;
    };
    GetAddressBalanceEVME401.discriminator = undefined;
    GetAddressBalanceEVME401.attributeTypeMap = [
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
    return GetAddressBalanceEVME401;
}());
exports.GetAddressBalanceEVME401 = GetAddressBalanceEVME401;
//# sourceMappingURL=getAddressBalanceEVME401.js.map