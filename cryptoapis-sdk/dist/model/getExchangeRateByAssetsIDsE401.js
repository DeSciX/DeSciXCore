"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDsE401 = void 0;
var GetExchangeRateByAssetsIDsE401 = (function () {
    function GetExchangeRateByAssetsIDsE401() {
    }
    GetExchangeRateByAssetsIDsE401.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDsE401.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDsE401.discriminator = undefined;
    GetExchangeRateByAssetsIDsE401.attributeTypeMap = [
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
    return GetExchangeRateByAssetsIDsE401;
}());
exports.GetExchangeRateByAssetsIDsE401 = GetExchangeRateByAssetsIDsE401;
//# sourceMappingURL=getExchangeRateByAssetsIDsE401.js.map