"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner = ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner.js.map