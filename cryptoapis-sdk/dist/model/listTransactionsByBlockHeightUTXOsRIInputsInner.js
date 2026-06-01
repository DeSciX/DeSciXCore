"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRIInputsInner = void 0;
var ListTransactionsByBlockHeightUTXOsRIInputsInner = (function () {
    function ListTransactionsByBlockHeightUTXOsRIInputsInner() {
    }
    ListTransactionsByBlockHeightUTXOsRIInputsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRIInputsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRIInputsInner.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRIInputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "coinbase",
            "baseName": "coinbase",
            "type": "string"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerScript"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHeightUTXOsRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRIInputsInner;
}());
exports.ListTransactionsByBlockHeightUTXOsRIInputsInner = ListTransactionsByBlockHeightUTXOsRIInputsInner;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRIInputsInner.js.map