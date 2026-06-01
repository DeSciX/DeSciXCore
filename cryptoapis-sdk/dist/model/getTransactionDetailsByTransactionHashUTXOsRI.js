"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsRI = void 0;
var GetTransactionDetailsByTransactionHashUTXOsRI = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsRI() {
    }
    GetTransactionDetailsByTransactionHashUTXOsRI.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsRI.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsRI.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsRI.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIFee"
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
            "name": "isConfirmed",
            "baseName": "isConfirmed",
            "type": "boolean"
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
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIMinedInBlock"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<GetTransactionDetailsByTransactionHashUTXOsRIInputsInner>"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<GetTransactionDetailsByTransactionHashUTXOsRIOutputsInner>"
        },
        {
            "name": "recipients",
            "baseName": "recipients",
            "type": "Array<GetTransactionDetailsByTransactionHashUTXOsRIRecipientsInner>"
        },
        {
            "name": "senders",
            "baseName": "senders",
            "type": "Array<GetTransactionDetailsByTransactionHashUTXOsRISendersInner>"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "GetTransactionDetailsByTransactionHashUTXOsRIBSZ"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsRI;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsRI = GetTransactionDetailsByTransactionHashUTXOsRI;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsRI.js.map