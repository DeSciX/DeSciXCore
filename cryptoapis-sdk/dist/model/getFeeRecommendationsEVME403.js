"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVME403 = void 0;
var GetFeeRecommendationsEVME403 = (function () {
    function GetFeeRecommendationsEVME403() {
    }
    GetFeeRecommendationsEVME403.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVME403.attributeTypeMap;
    };
    GetFeeRecommendationsEVME403.discriminator = undefined;
    GetFeeRecommendationsEVME403.attributeTypeMap = [
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
    return GetFeeRecommendationsEVME403;
}());
exports.GetFeeRecommendationsEVME403 = GetFeeRecommendationsEVME403;
//# sourceMappingURL=getFeeRecommendationsEVME403.js.map