"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRI = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRI = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRI() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRI.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRI.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRI.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRI.attributeTypeMap = [
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
            "name": "isReplaceable",
            "baseName": "isReplaceable",
            "type": "boolean"
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
            "type": "Array<ListUnconfirmedTransactionsByAddressUTXOsRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<ListUnconfirmedTransactionsByAddressUTXOsRIOutputsInner>"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<ListUnconfirmedTransactionsByAddressUTXOsRISendersInner>"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIBSZ"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRI;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRI = ListUnconfirmedTransactionsByAddressUTXOsRI;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRI.js.map