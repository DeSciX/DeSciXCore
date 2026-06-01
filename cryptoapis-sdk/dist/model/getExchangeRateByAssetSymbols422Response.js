"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbols422Response = void 0;
var GetExchangeRateByAssetSymbols422Response = (function () {
    function GetExchangeRateByAssetSymbols422Response() {
    }
    GetExchangeRateByAssetSymbols422Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbols422Response.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbols422Response.discriminator = undefined;
    GetExchangeRateByAssetSymbols422Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetSymbolsE422"
        }
    ];
    return GetExchangeRateByAssetSymbols422Response;
}());
exports.GetExchangeRateByAssetSymbols422Response = GetExchangeRateByAssetSymbols422Response;
//# sourceMappingURL=getExchangeRateByAssetSymbols422Response.js.map