"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsE401 = void 0;
var GetExchangeRateByAssetSymbolsE401 = (function () {
    function GetExchangeRateByAssetSymbolsE401() {
    }
    GetExchangeRateByAssetSymbolsE401.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsE401.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsE401.discriminator = undefined;
    GetExchangeRateByAssetSymbolsE401.attributeTypeMap = [
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
    return GetExchangeRateByAssetSymbolsE401;
}());
exports.GetExchangeRateByAssetSymbolsE401 = GetExchangeRateByAssetSymbolsE401;
//# sourceMappingURL=getExchangeRateByAssetSymbolsE401.js.map