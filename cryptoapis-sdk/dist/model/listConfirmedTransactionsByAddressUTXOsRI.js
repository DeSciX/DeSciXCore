"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRI = void 0;
var ListConfirmedTransactionsByAddressUTXOsRI = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRI() {
    }
    ListConfirmedTransactionsByAddressUTXOsRI.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRI.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRI.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRI.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOsRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOsRIOutputsInner>"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListConfirmedTransactionsByAddressUTXOsRISendersInner>"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListConfirmedTransactionsByAddressUTXOsRIBSZ"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRI;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRI = ListConfirmedTransactionsByAddressUTXOsRI;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRI.js.map