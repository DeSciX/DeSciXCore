"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVME400 = void 0;
var GetAddressStatisticsEVME400 = (function () {
    function GetAddressStatisticsEVME400() {
    }
    GetAddressStatisticsEVME400.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVME400.attributeTypeMap;
    };
    GetAddressStatisticsEVME400.discriminator = undefined;
    GetAddressStatisticsEVME400.attributeTypeMap = [
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
    return GetAddressStatisticsEVME400;
}());
exports.GetAddressStatisticsEVME400 = GetAddressStatisticsEVME400;
//# sourceMappingURL=getAddressStatisticsEVME400.js.map