"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsR = void 0;
var ListTransactionsByBlockHeightUTXOsR = (function () {
    function ListTransactionsByBlockHeightUTXOsR() {
    }
    ListTransactionsByBlockHeightUTXOsR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsR.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsR.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightUTXOsRData"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsR;
}());
exports.ListTransactionsByBlockHeightUTXOsR = ListTransactionsByBlockHeightUTXOsR;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsR.js.map