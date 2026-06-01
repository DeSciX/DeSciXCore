"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDsE403 = void 0;
var GetExchangeRateByAssetsIDsE403 = (function () {
    function GetExchangeRateByAssetsIDsE403() {
    }
    GetExchangeRateByAssetsIDsE403.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDsE403.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDsE403.discriminator = undefined;
    GetExchangeRateByAssetsIDsE403.attributeTypeMap = [
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
    return GetExchangeRateByAssetsIDsE403;
}());
exports.GetExchangeRateByAssetsIDsE403 = GetExchangeRateByAssetsIDsE403;
//# sourceMappingURL=getExchangeRateByAssetsIDsE403.js.map