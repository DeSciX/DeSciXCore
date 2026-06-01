"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOs401Response = void 0;
var GetAddressStatisticsUTXOs401Response = (function () {
    function GetAddressStatisticsUTXOs401Response() {
    }
    GetAddressStatisticsUTXOs401Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOs401Response.attributeTypeMap;
    };
    GetAddressStatisticsUTXOs401Response.discriminator = undefined;
    GetAddressStatisticsUTXOs401Response.attributeTypeMap = [
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
            "type": "GetAddressStatisticsUTXOsE401"
        }
    ];
    return GetAddressStatisticsUTXOs401Response;
}());
exports.GetAddressStatisticsUTXOs401Response = GetAddressStatisticsUTXOs401Response;
//# sourceMappingURL=getAddressStatisticsUTXOs401Response.js.map