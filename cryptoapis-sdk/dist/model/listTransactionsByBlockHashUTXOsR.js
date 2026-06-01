"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsR = void 0;
var ListTransactionsByBlockHashUTXOsR = (function () {
    function ListTransactionsByBlockHashUTXOsR() {
    }
    ListTransactionsByBlockHashUTXOsR.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsR.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsR.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsR.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashUTXOsRData"
        }
    ];
    return ListTransactionsByBlockHashUTXOsR;
}());
exports.ListTransactionsByBlockHashUTXOsR = ListTransactionsByBlockHashUTXOsR;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsR.js.map