"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsR = void 0;
var GetExchangeRateByAssetSymbolsR = (function () {
    function GetExchangeRateByAssetSymbolsR() {
    }
    GetExchangeRateByAssetSymbolsR.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsR.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsR.discriminator = undefined;
    GetExchangeRateByAssetSymbolsR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "GetExchangeRateByAssetSymbolsRData"
        }
    ];
    return GetExchangeRateByAssetSymbolsR;
}());
exports.GetExchangeRateByAssetSymbolsR = GetExchangeRateByAssetSymbolsR;
//# sourceMappingURL=getExchangeRateByAssetSymbolsR.js.map