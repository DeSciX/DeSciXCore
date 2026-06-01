"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsKASPAR = void 0;
var GetFeeRecommendationsKASPAR = (function () {
    function GetFeeRecommendationsKASPAR() {
    }
    GetFeeRecommendationsKASPAR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsKASPAR.attributeTypeMap;
    };
    GetFeeRecommendationsKASPAR.discriminator = undefined;
    GetFeeRecommendationsKASPAR.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsKASPARData"
        }
    ];
    return GetFeeRecommendationsKASPAR;
}());
exports.GetFeeRecommendationsKASPAR = GetFeeRecommendationsKASPAR;
//# sourceMappingURL=getFeeRecommendationsKASPAR.js.map