"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVME401 = void 0;
var GetAddressStatisticsEVME401 = (function () {
    function GetAddressStatisticsEVME401() {
    }
    GetAddressStatisticsEVME401.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVME401.attributeTypeMap;
    };
    GetAddressStatisticsEVME401.discriminator = undefined;
    GetAddressStatisticsEVME401.attributeTypeMap = [
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
    return GetAddressStatisticsEVME401;
}());
exports.GetAddressStatisticsEVME401 = GetAddressStatisticsEVME401;
//# sourceMappingURL=getAddressStatisticsEVME401.js.map