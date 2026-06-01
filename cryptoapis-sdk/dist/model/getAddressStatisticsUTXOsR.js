"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOsR = void 0;
var GetAddressStatisticsUTXOsR = (function () {
    function GetAddressStatisticsUTXOsR() {
    }
    GetAddressStatisticsUTXOsR.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOsR.attributeTypeMap;
    };
    GetAddressStatisticsUTXOsR.discriminator = undefined;
    GetAddressStatisticsUTXOsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetAddressStatisticsUTXOsRData"
        }
    ];
    return GetAddressStatisticsUTXOsR;
}());
exports.GetAddressStatisticsUTXOsR = GetAddressStatisticsUTXOsR;
//# sourceMappingURL=getAddressStatisticsUTXOsR.js.map