"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDsRI = void 0;
var GetExchangeRateByAssetsIDsRI = (function () {
    function GetExchangeRateByAssetsIDsRI() {
    }
    GetExchangeRateByAssetsIDsRI.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDsRI.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDsRI.discriminator = undefined;
    GetExchangeRateByAssetsIDsRI.attributeTypeMap = [
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
    return GetExchangeRateByAssetsIDsRI;
}());
exports.GetExchangeRateByAssetsIDsRI = GetExchangeRateByAssetsIDsRI;
//# sourceMappingURL=getExchangeRateByAssetsIDsRI.js.map