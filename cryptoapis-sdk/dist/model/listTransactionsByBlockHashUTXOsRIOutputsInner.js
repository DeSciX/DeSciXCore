"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRIOutputsInner = void 0;
var ListTransactionsByBlockHashUTXOsRIOutputsInner = (function () {
    function ListTransactionsByBlockHashUTXOsRIOutputsInner() {
    }
    ListTransactionsByBlockHashUTXOsRIOutputsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRIOutputsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRIOutputsInner.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRIOutputsInner.attributeTypeMap = [
        {
            "name": "addresses",
            "baseName": "addresses",
            "type": "Array<string>"
        },
        {
            "name": "isSpent",
            "baseName": "isSpent",
            "type": "boolean"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHashUTXOsRIOutputsInnerValue"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRIOutputsInner;
}());
exports.ListTransactionsByBlockHashUTXOsRIOutputsInner = ListTransactionsByBlockHashUTXOsRIOutputsInner;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRIOutputsInner.js.map