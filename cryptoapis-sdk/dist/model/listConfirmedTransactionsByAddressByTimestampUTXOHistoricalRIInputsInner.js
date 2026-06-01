"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInnerValue"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner.js.map