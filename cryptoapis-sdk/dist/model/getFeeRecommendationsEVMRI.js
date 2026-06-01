"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVMRI = void 0;
var GetFeeRecommendationsEVMRI = (function () {
    function GetFeeRecommendationsEVMRI() {
    }
    GetFeeRecommendationsEVMRI.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVMRI.attributeTypeMap;
    };
    GetFeeRecommendationsEVMRI.discriminator = undefined;
    GetFeeRecommendationsEVMRI.attributeTypeMap = [
        {
            "name": "fast",
            "baseName": "fast",
            "type": "string"
        },
        {
            "name": "slow",
            "baseName": "slow",
            "type": "string"
        },
        {
            "name": "standard",
            "baseName": "standard",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetFeeRecommendationsEVMRI;
}());
exports.GetFeeRecommendationsEVMRI = GetFeeRecommendationsEVMRI;
//# sourceMappingURL=getFeeRecommendationsEVMRI.js.map