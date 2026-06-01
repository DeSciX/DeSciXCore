"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOsE401 = void 0;
var GetAddressStatisticsUTXOsE401 = (function () {
    function GetAddressStatisticsUTXOsE401() {
    }
    GetAddressStatisticsUTXOsE401.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOsE401.attributeTypeMap;
    };
    GetAddressStatisticsUTXOsE401.discriminator = undefined;
    GetAddressStatisticsUTXOsE401.attributeTypeMap = [
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
    return GetAddressStatisticsUTXOsE401;
}());
exports.GetAddressStatisticsUTXOsE401 = GetAddressStatisticsUTXOsE401;
//# sourceMappingURL=getAddressStatisticsUTXOsE401.js.map