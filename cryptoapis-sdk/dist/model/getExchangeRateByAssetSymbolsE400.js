"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsE400 = void 0;
var GetExchangeRateByAssetSymbolsE400 = (function () {
    function GetExchangeRateByAssetSymbolsE400() {
    }
    GetExchangeRateByAssetSymbolsE400.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsE400.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsE400.discriminator = undefined;
    GetExchangeRateByAssetSymbolsE400.attributeTypeMap = [
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
    return GetExchangeRateByAssetSymbolsE400;
}());
exports.GetExchangeRateByAssetSymbolsE400 = GetExchangeRateByAssetSymbolsE400;
//# sourceMappingURL=getExchangeRateByAssetSymbolsE400.js.map