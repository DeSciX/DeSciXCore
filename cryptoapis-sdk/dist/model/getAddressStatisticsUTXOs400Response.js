"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOs400Response = void 0;
var GetAddressStatisticsUTXOs400Response = (function () {
    function GetAddressStatisticsUTXOs400Response() {
    }
    GetAddressStatisticsUTXOs400Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOs400Response.attributeTypeMap;
    };
    GetAddressStatisticsUTXOs400Response.discriminator = undefined;
    GetAddressStatisticsUTXOs400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetAddressStatisticsUTXOsE400"
        }
    ];
    return GetAddressStatisticsUTXOs400Response;
}());
exports.GetAddressStatisticsUTXOs400Response = GetAddressStatisticsUTXOs400Response;
//# sourceMappingURL=getAddressStatisticsUTXOs400Response.js.map