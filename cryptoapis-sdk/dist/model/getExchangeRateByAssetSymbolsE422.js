"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsE422 = void 0;
var GetExchangeRateByAssetSymbolsE422 = (function () {
    function GetExchangeRateByAssetSymbolsE422() {
    }
    GetExchangeRateByAssetSymbolsE422.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsE422.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsE422.discriminator = undefined;
    GetExchangeRateByAssetSymbolsE422.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return GetExchangeRateByAssetSymbolsE422;
}());
exports.GetExchangeRateByAssetSymbolsE422 = GetExchangeRateByAssetSymbolsE422;
//# sourceMappingURL=getExchangeRateByAssetSymbolsE422.js.map