"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVME400 = void 0;
var GetAddressBalanceEVME400 = (function () {
    function GetAddressBalanceEVME400() {
    }
    GetAddressBalanceEVME400.getAttributeTypeMap = function () {
        return GetAddressBalanceEVME400.attributeTypeMap;
    };
    GetAddressBalanceEVME400.discriminator = undefined;
    GetAddressBalanceEVME400.attributeTypeMap = [
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
    return GetAddressBalanceEVME400;
}());
exports.GetAddressBalanceEVME400 = GetAddressBalanceEVME400;
//# sourceMappingURL=getAddressBalanceEVME400.js.map