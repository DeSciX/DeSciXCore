"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRI = void 0;
var ListTransactionsByBlockHeightUTXOsRI = (function () {
    function ListTransactionsByBlockHeightUTXOsRI() {
    }
    ListTransactionsByBlockHeightUTXOsRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRI.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRI.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByBlockHeightUTXOsRIFee"
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
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListTransactionsByBlockHeightUTXOsRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListTransactionsByBlockHeightUTXOsRIOutputsInner>"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListTransactionsByBlockHeightUTXOsRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListTransactionsByBlockHeightUTXOsRISendersInner>"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListTransactionsByBlockHeightUTXOsRIBSZ"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRI;
}());
exports.ListTransactionsByBlockHeightUTXOsRI = ListTransactionsByBlockHeightUTXOsRI;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRI.js.map