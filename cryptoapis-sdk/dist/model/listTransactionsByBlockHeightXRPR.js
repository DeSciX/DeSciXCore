"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPR = void 0;
var ListTransactionsByBlockHeightXRPR = (function () {
    function ListTransactionsByBlockHeightXRPR() {
    }
    ListTransactionsByBlockHeightXRPR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPR.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPR.discriminator = undefined;
    ListTransactionsByBlockHeightXRPR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightXRPRData"
        }
    ];
    return ListTransactionsByBlockHeightXRPR;
}());
exports.ListTransactionsByBlockHeightXRPR = ListTransactionsByBlockHeightXRPR;
//# sourceMappingURL=listTransactionsByBlockHeightXRPR.js.map