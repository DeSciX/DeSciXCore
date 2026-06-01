"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVM401Response = void 0;
var GetAddressStatisticsEVM401Response = (function () {
    function GetAddressStatisticsEVM401Response() {
    }
    GetAddressStatisticsEVM401Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVM401Response.attributeTypeMap;
    };
    GetAddressStatisticsEVM401Response.discriminator = undefined;
    GetAddressStatisticsEVM401Response.attributeTypeMap = [
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
            "type": "GetAddressStatisticsEVME401"
        }
    ];
    return GetAddressStatisticsEVM401Response;
}());
exports.GetAddressStatisticsEVM401Response = GetAddressStatisticsEVM401Response;
//# sourceMappingURL=getAddressStatisticsEVM401Response.js.map