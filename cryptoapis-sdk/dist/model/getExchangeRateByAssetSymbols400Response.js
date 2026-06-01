"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbols400Response = void 0;
var GetExchangeRateByAssetSymbols400Response = (function () {
    function GetExchangeRateByAssetSymbols400Response() {
    }
    GetExchangeRateByAssetSymbols400Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbols400Response.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbols400Response.discriminator = undefined;
    GetExchangeRateByAssetSymbols400Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetSymbolsE400"
        }
    ];
    return GetExchangeRateByAssetSymbols400Response;
}());
exports.GetExchangeRateByAssetSymbols400Response = GetExchangeRateByAssetSymbols400Response;
//# sourceMappingURL=getExchangeRateByAssetSymbols400Response.js.map