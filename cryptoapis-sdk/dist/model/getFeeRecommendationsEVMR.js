"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsEVMR = void 0;
var GetFeeRecommendationsEVMR = (function () {
    function GetFeeRecommendationsEVMR() {
    }
    GetFeeRecommendationsEVMR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsEVMR.attributeTypeMap;
    };
    GetFeeRecommendationsEVMR.discriminator = undefined;
    GetFeeRecommendationsEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetFeeRecommendationsEVMRData"
        }
    ];
    return GetFeeRecommendationsEVMR;
}());
exports.GetFeeRecommendationsEVMR = GetFeeRecommendationsEVMR;
//# sourceMappingURL=getFeeRecommendationsEVMR.js.map