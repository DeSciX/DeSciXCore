"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVME400 = void 0;
var GetFeeRecommendationsEVME400 = (function () {
    function GetFeeRecommendationsEVME400() {
    }
    GetFeeRecommendationsEVME400.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVME400.attributeTypeMap;
    };
    GetFeeRecommendationsEVME400.discriminator = undefined;
    GetFeeRecommendationsEVME400.attributeTypeMap = [
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
    return GetFeeRecommendationsEVME400;
}());
exports.GetFeeRecommendationsEVME400 = GetFeeRecommendationsEVME400;
//# sourceMappingURL=getFeeRecommendationsEVME400.js.map