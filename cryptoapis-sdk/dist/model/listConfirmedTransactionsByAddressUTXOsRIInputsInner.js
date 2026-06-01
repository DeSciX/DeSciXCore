"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRIInputsInner = void 0;
var ListConfirmedTransactionsByAddressUTXOsRIInputsInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRIInputsInner() {
    }
    ListConfirmedTransactionsByAddressUTXOsRIInputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRIInputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRIInputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRIInputsInner.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRIInputsInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRIInputsInner = ListConfirmedTransactionsByAddressUTXOsRIInputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRIInputsInner.js.map