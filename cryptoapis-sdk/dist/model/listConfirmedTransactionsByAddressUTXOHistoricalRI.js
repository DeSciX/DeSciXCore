"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRI = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalRI = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalRI() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIFee"
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
            "name": "locktime",
            "baseName": "locktime",
            "type": "number"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
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
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIOutputsInner>"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOHistoricalRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOHistoricalRISendersInner>"
        },
        {
            "name": "blockchaiSpecific",
            "baseName": "blockchaiSpecific",
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIBlockchaiSpecific"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalRI;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRI = ListConfirmedTransactionsByAddressUTXOHistoricalRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalRI.js.map