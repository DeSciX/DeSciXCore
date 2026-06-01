"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOsE400 = void 0;
var GetAddressStatisticsUTXOsE400 = (function () {
    function GetAddressStatisticsUTXOsE400() {
    }
    GetAddressStatisticsUTXOsE400.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOsE400.attributeTypeMap;
    };
    GetAddressStatisticsUTXOsE400.discriminator = undefined;
    GetAddressStatisticsUTXOsE400.attributeTypeMap = [
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
    return GetAddressStatisticsUTXOsE400;
}());
exports.GetAddressStatisticsUTXOsE400 = GetAddressStatisticsUTXOsE400;
//# sourceMappingURL=getAddressStatisticsUTXOsE400.js.map