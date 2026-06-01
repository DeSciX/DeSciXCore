"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEIP1559FeeRecommendationsEVME400 = void 0;
var GetEIP1559FeeRecommendationsEVME400 = (function () {
    function GetEIP1559FeeRecommendationsEVME400() {
    }
    GetEIP1559FeeRecommendationsEVME400.getAttributeTypeMap = function () {
        return GetEIP1559FeeRecommendationsEVME400.attributeTypeMap;
    };
    GetEIP1559FeeRecommendationsEVME400.discriminator = undefined;
    GetEIP1559FeeRecommendationsEVME400.attributeTypeMap = [
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
    return GetEIP1559FeeRecommendationsEVME400;
}());
exports.GetEIP1559FeeRecommendationsEVME400 = GetEIP1559FeeRecommendationsEVME400;
//# sourceMappingURL=getEIP1559FeeRecommendationsEVME400.js.map