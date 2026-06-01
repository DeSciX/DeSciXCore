"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRPR = void 0;
var GetBlockDetailsByBlockHashXRPR = (function () {
    function GetBlockDetailsByBlockHashXRPR() {
    }
    GetBlockDetailsByBlockHashXRPR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRPR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRPR.discriminator = undefined;
    GetBlockDetailsByBlockHashXRPR.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashXRPRData"
        }
    ];
    return GetBlockDetailsByBlockHashXRPR;
}());
exports.GetBlockDetailsByBlockHashXRPR = GetBlockDetailsByBlockHashXRPR;
//# sourceMappingURL=getBlockDetailsByBlockHashXRPR.js.map