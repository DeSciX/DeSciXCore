"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVM404Response = void 0;
var GetAddressStatisticsEVM404Response = (function () {
    function GetAddressStatisticsEVM404Response() {
    }
    GetAddressStatisticsEVM404Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVM404Response.attributeTypeMap;
    };
    GetAddressStatisticsEVM404Response.discriminator = undefined;
    GetAddressStatisticsEVM404Response.attributeTypeMap = [
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
            "type": "NotFound"
        }
    ];
    return GetAddressStatisticsEVM404Response;
}());
exports.GetAddressStatisticsEVM404Response = GetAddressStatisticsEVM404Response;
//# sourceMappingURL=getAddressStatisticsEVM404Response.js.map