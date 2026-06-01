"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsUTXOs403Response = void 0;
var GetAddressStatisticsUTXOs403Response = (function () {
    function GetAddressStatisticsUTXOs403Response() {
    }
    GetAddressStatisticsUTXOs403Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsUTXOs403Response.attributeTypeMap;
    };
    GetAddressStatisticsUTXOs403Response.discriminator = undefined;
    GetAddressStatisticsUTXOs403Response.attributeTypeMap = [
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
            "type": "GetAddressStatisticsUTXOsE403"
        }
    ];
    return GetAddressStatisticsUTXOs403Response;
}());
exports.GetAddressStatisticsUTXOs403Response = GetAddressStatisticsUTXOs403Response;
//# sourceMappingURL=getAddressStatisticsUTXOs403Response.js.map