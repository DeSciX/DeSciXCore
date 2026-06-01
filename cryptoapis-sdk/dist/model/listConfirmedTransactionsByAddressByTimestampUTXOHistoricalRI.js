"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIInputsInner>"
        },
        {
            "name": "locktime",
            "baseName": "locktime",
            "type": "number"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIOutputsInner>"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRISendersInner>"
        },
        {
            "name": "size",
            "baseName": "size",
            "type": "number"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "number"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRIMinedInBlock"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalRI.js.map