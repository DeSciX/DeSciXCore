"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRPR = void 0;
var GetTransactionDetailsByTransactionHashXRPR = (function () {
    function GetTransactionDetailsByTransactionHashXRPR() {
    }
    GetTransactionDetailsByTransactionHashXRPR.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRPR.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRPR.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRPR.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashXRPRData"
        }
    ];
    return GetTransactionDetailsByTransactionHashXRPR;
}());
exports.GetTransactionDetailsByTransactionHashXRPR = GetTransactionDetailsByTransactionHashXRPR;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRPR.js.map