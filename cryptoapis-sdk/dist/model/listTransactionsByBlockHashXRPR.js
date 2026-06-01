"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPR = void 0;
var ListTransactionsByBlockHashXRPR = (function () {
    function ListTransactionsByBlockHashXRPR() {
    }
    ListTransactionsByBlockHashXRPR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPR.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPR.discriminator = undefined;
    ListTransactionsByBlockHashXRPR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashXRPRData"
        }
    ];
    return ListTransactionsByBlockHashXRPR;
}());
exports.ListTransactionsByBlockHashXRPR = ListTransactionsByBlockHashXRPR;
//# sourceMappingURL=listTransactionsByBlockHashXRPR.js.map