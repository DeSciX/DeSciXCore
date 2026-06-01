"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsRI = void 0;
var GetExchangeRateByAssetSymbolsRI = (function () {
    function GetExchangeRateByAssetSymbolsRI() {
    }
    GetExchangeRateByAssetSymbolsRI.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsRI.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsRI.discriminator = undefined;
    GetExchangeRateByAssetSymbolsRI.attributeTypeMap = [
        {
            "name": "calculationTimestamp",
            "baseName": "calculationTimestamp",
            "type": "number"
        },
        {
            "name": "fromAssetId",
            "baseName": "fromAssetId",
            "type": "string"
        },
        {
            "name": "fromAssetSymbol",
            "baseName": "fromAssetSymbol",
            "type": "string"
        },
        {
            "name": "rate",
            "baseName": "rate",
            "type": "string"
        },
        {
            "name": "toAssetId",
            "baseName": "toAssetId",
            "type": "string"
        },
        {
            "name": "toAssetSymbol",
            "baseName": "toAssetSymbol",
            "type": "string"
        }
    ];
    return GetExchangeRateByAssetSymbolsRI;
}());
exports.GetExchangeRateByAssetSymbolsRI = GetExchangeRateByAssetSymbolsRI;
//# sourceMappingURL=getExchangeRateByAssetSymbolsRI.js.map