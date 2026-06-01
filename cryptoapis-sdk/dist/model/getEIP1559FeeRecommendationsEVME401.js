"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVME401 = void 0;
var GetEIP1559FeeRecommendationsEVME401 = (function () {
    function GetEIP1559FeeRecommendationsEVME401() {
    }
    GetEIP1559FeeRecommendationsEVME401.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVME401.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVME401.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVME401.attributeTypeMap = [
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
    return GetEIP1559FeeRecommendationsEVME401;
}());
exports.GetEIP1559FeeRecommendationsEVME401 = GetEIP1559FeeRecommendationsEVME401;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVME401.js.map