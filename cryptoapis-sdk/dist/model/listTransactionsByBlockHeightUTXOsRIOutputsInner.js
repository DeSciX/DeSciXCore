"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRIOutputsInner = void 0;
var ListTransactionsByBlockHeightUTXOsRIOutputsInner = (function () {
    function ListTransactionsByBlockHeightUTXOsRIOutputsInner() {
    }
    ListTransactionsByBlockHeightUTXOsRIOutputsInner.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRIOutputsInner.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRIOutputsInner.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRIOutputsInner.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsRIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIInputsInnerValue"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRIOutputsInner;
}());
exports.ListTransactionsByBlockHeightUTXOsRIOutputsInner = ListTransactionsByBlockHeightUTXOsRIOutputsInner;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRIOutputsInner.js.map