"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDsE422 = void 0;
var GetExchangeRateByAssetsIDsE422 = (function () {
    function GetExchangeRateByAssetsIDsE422() {
    }
    GetExchangeRateByAssetsIDsE422.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDsE422.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDsE422.discriminator = undefined;
    GetExchangeRateByAssetsIDsE422.attributeTypeMap = [
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
    return GetExchangeRateByAssetsIDsE422;
}());
exports.GetExchangeRateByAssetsIDsE422 = GetExchangeRateByAssetsIDsE422;
//# sourceMappingURL=getExchangeRateByAssetsIDsE422.js.map