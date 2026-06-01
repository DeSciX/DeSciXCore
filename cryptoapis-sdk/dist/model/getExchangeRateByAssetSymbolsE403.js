"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetSymbolsE403 = void 0;
var GetExchangeRateByAssetSymbolsE403 = (function () {
    function GetExchangeRateByAssetSymbolsE403() {
    }
    GetExchangeRateByAssetSymbolsE403.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetSymbolsE403.attributeTypeMap;
    };
    GetExchangeRateByAssetSymbolsE403.discriminator = undefined;
    GetExchangeRateByAssetSymbolsE403.attributeTypeMap = [
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
    return GetExchangeRateByAssetSymbolsE403;
}());
exports.GetExchangeRateByAssetSymbolsE403 = GetExchangeRateByAssetSymbolsE403;
//# sourceMappingURL=getExchangeRateByAssetSymbolsE403.js.map