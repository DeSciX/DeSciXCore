"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbols401Response = void 0;
var GetExchangeRateByAssetSymbols401Response = (function () {
    function GetExchangeRateByAssetSymbols401Response() {
    }
    GetExchangeRateByAssetSymbols401Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbols401Response.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbols401Response.discriminator = undefined;
    GetExchangeRateByAssetSymbols401Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetSymbolsE401"
        }
    ];
    return GetExchangeRateByAssetSymbols401Response;
}());
exports.GetExchangeRateByAssetSymbols401Response = GetExchangeRateByAssetSymbols401Response;
//# sourceMappingURL=getExchangeRateByAssetSymbols401Response.js.map