"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVME403 = void 0;
var GetAddressStatisticsEVME403 = (function () {
    function GetAddressStatisticsEVME403() {
    }
    GetAddressStatisticsEVME403.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVME403.attributeTypeMap;
    };
    GetAddressStatisticsEVME403.discriminator = undefined;
    GetAddressStatisticsEVME403.attributeTypeMap = [
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
    return GetAddressStatisticsEVME403;
}());
exports.GetAddressStatisticsEVME403 = GetAddressStatisticsEVME403;
//# sourceMappingURL=getAddressStatisticsEVME403.js.map