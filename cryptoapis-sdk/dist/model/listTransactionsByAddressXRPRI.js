"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPRI = void 0;
var ListTransactionsByAddressXRPRI = (function () {
    function ListTransactionsByAddressXRPRI() {
    }
    ListTransactionsByAddressXRPRI.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPRI.attributeTypeMap;
    };
    ListTransactionsByAddressXRPRI.discriminator = undefined;
    ListTransactionsByAddressXRPRI.attributeTypeMap = [
        {
            "name": "destinationTag",
            "baseName": "destinationTag",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "number"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "status",
            "baseName": "status",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "ListTransactionsByAddressXRPRIFee"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListTransactionsByAddressXRPRIMinedInBlock"
        },
        {
            "name": "offer",
            "baseName": "offer",
            "type": "ListTransactionsByAddressXRPRIOffer"
        },
        {
            "name": "receive",
            "baseName": "receive",
            "type": "ListTransactionsByAddressXRPRIReceive"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByAddressXRPRIValue"
        }
    ];
    return ListTransactionsByAddressXRPRI;
}());
exports.ListTransactionsByAddressXRPRI = ListTransactionsByAddressXRPRI;
//# sourceMappingURL=listTransactionsByAddressXRPRI.js.map