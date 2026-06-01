"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbols403Response = void 0;
var GetExchangeRateByAssetSymbols403Response = (function () {
    function GetExchangeRateByAssetSymbols403Response() {
    }
    GetExchangeRateByAssetSymbols403Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbols403Response.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbols403Response.discriminator = undefined;
    GetExchangeRateByAssetSymbols403Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetSymbolsE403"
        }
    ];
    return GetExchangeRateByAssetSymbols403Response;
}());
exports.GetExchangeRateByAssetSymbols403Response = GetExchangeRateByAssetSymbols403Response;
//# sourceMappingURL=getExchangeRateByAssetSymbols403Response.js.map