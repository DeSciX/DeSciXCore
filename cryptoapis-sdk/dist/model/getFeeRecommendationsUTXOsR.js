"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFeeRecommendationsUTXOsR = void 0;
var GetFeeRecommendationsUTXOsR = (function () {
    function GetFeeRecommendationsUTXOsR() {
    }
    GetFeeRecommendationsUTXOsR.getAttributeTypeMap = function () {
        return GetFeeRecommendationsUTXOsR.attributeTypeMap;
    };
    GetFeeRecommendationsUTXOsR.discriminator = undefined;
    GetFeeRecommendationsUTXOsR.attributeTypeMap = [
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
            "type": "GetFeeRecommendationsUTXOsRData"
        }
    ];
    return GetFeeRecommendationsUTXOsR;
}());
exports.GetFeeRecommendationsUTXOsR = GetFeeRecommendationsUTXOsR;
//# sourceMappingURL=getFeeRecommendationsUTXOsR.js.map