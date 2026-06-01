"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRIInputsInner = void 0;
var ListTransactionsByBlockHashUTXOsRIInputsInner = (function () {
    function ListTransactionsByBlockHashUTXOsRIInputsInner() {
    }
    ListTransactionsByBlockHashUTXOsRIInputsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRIInputsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRIInputsInner.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRIInputsInner.attributeTypeMap = [
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
            "name": "oututIndex",
            "baseName": "oututIndex",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerScript"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHashUTXOsRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRIInputsInner;
}());
exports.ListTransactionsByBlockHashUTXOsRIInputsInner = ListTransactionsByBlockHashUTXOsRIInputsInner;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRIInputsInner.js.map