"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVME401 = void 0;
var GetFeeRecommendationsEVME401 = (function () {
    function GetFeeRecommendationsEVME401() {
    }
    GetFeeRecommendationsEVME401.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVME401.attributeTypeMap;
    };
    GetFeeRecommendationsEVME401.discriminator = undefined;
    GetFeeRecommendationsEVME401.attributeTypeMap = [
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
    return GetFeeRecommendationsEVME401;
}());
exports.GetFeeRecommendationsEVME401 = GetFeeRecommendationsEVME401;
//# sourceMappingURL=getFeeRecommendationsEVME401.js.map