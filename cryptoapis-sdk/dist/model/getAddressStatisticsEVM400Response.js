"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVM400Response = void 0;
var GetAddressStatisticsEVM400Response = (function () {
    function GetAddressStatisticsEVM400Response() {
    }
    GetAddressStatisticsEVM400Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVM400Response.attributeTypeMap;
    };
    GetAddressStatisticsEVM400Response.discriminator = undefined;
    GetAddressStatisticsEVM400Response.attributeTypeMap = [
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
            "type": "GetAddressStatisticsEVME400"
        }
    ];
    return GetAddressStatisticsEVM400Response;
}());
exports.GetAddressStatisticsEVM400Response = GetAddressStatisticsEVM400Response;
//# sourceMappingURL=getAddressStatisticsEVM400Response.js.map