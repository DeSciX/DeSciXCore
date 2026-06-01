"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressStatisticsEVM403Response = void 0;
var GetAddressStatisticsEVM403Response = (function () {
    function GetAddressStatisticsEVM403Response() {
    }
    GetAddressStatisticsEVM403Response.getAttributeTypeMap = function () {
        return GetAddressStatisticsEVM403Response.attributeTypeMap;
    };
    GetAddressStatisticsEVM403Response.discriminator = undefined;
    GetAddressStatisticsEVM403Response.attributeTypeMap = [
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
            "type": "GetAddressStatisticsEVME403"
        }
    ];
    return GetAddressStatisticsEVM403Response;
}());
exports.GetAddressStatisticsEVM403Response = GetAddressStatisticsEVM403Response;
//# sourceMappingURL=getAddressStatisticsEVM403Response.js.map