"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVME403 = void 0;
var GetEIP1559FeeRecommendationsEVME403 = (function () {
    function GetEIP1559FeeRecommendationsEVME403() {
    }
    GetEIP1559FeeRecommendationsEVME403.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVME403.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVME403.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVME403.attributeTypeMap = [
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
    return GetEIP1559FeeRecommendationsEVME403;
}());
exports.GetEIP1559FeeRecommendationsEVME403 = GetEIP1559FeeRecommendationsEVME403;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVME403.js.map