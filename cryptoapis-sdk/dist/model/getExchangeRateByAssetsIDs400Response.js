"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDs400Response = void 0;
var GetExchangeRateByAssetsIDs400Response = (function () {
    function GetExchangeRateByAssetsIDs400Response() {
    }
    GetExchangeRateByAssetsIDs400Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDs400Response.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDs400Response.discriminator = undefined;
    GetExchangeRateByAssetsIDs400Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetsIDsE400"
        }
    ];
    return GetExchangeRateByAssetsIDs400Response;
}());
exports.GetExchangeRateByAssetsIDs400Response = GetExchangeRateByAssetsIDs400Response;
//# sourceMappingURL=getExchangeRateByAssetsIDs400Response.js.map