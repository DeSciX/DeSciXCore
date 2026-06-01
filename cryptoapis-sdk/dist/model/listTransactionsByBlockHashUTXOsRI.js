"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRI = void 0;
var ListTransactionsByBlockHashUTXOsRI = (function () {
    function ListTransactionsByBlockHashUTXOsRI() {
    }
    ListTransactionsByBlockHashUTXOsRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRI.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRI.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRI.attributeTypeMap = [
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
            "name": "size",
            "baseName": "size",
            "type": "number"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "number"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByBlockHashUTXOsRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListTransactionsByBlockHashUTXOsRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListTransactionsByBlockHashUTXOsRIOutputsInner>"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListTransactionsByBlockHashUTXOsRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListTransactionsByBlockHashUTXOsRISendersInner>"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListTransactionsByBlockHashUTXOsRIBSZ"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRI;
}());
exports.ListTransactionsByBlockHashUTXOsRI = ListTransactionsByBlockHashUTXOsRI;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRI.js.map