"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRPR = void 0;
var GetBlockDetailsByBlockHeightXRPR = (function () {
    function GetBlockDetailsByBlockHeightXRPR() {
    }
    GetBlockDetailsByBlockHeightXRPR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRPR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRPR.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRPR.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightXRPRData"
        }
    ];
    return GetBlockDetailsByBlockHeightXRPR;
}());
exports.GetBlockDetailsByBlockHeightXRPR = GetBlockDetailsByBlockHeightXRPR;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRPR.js.map