"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDsE400 = void 0;
var GetExchangeRateByAssetsIDsE400 = (function () {
    function GetExchangeRateByAssetsIDsE400() {
    }
    GetExchangeRateByAssetsIDsE400.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDsE400.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDsE400.discriminator = undefined;
    GetExchangeRateByAssetsIDsE400.attributeTypeMap = [
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
    return GetExchangeRateByAssetsIDsE400;
}());
exports.GetExchangeRateByAssetsIDsE400 = GetExchangeRateByAssetsIDsE400;
//# sourceMappingURL=getExchangeRateByAssetsIDsE400.js.map