"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRPRI = void 0;
var ListTransactionsByBlockHeightXRPRI = (function () {
    function ListTransactionsByBlockHeightXRPRI() {
    }
    ListTransactionsByBlockHeightXRPRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRPRI.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRPRI.discriminator = undefined;
    ListTransactionsByBlockHeightXRPRI.attributeTypeMap = [
        {
            "name": "additionalData",
            "baseName": "additionalData",
            "type": "string"
        },
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
            "type": "ListTransactionsByBlockHeightXRPRIFee"
        },
        {
            "name": "offer",
            "baseName": "offer",
            "type": "ListTransactionsByBlockHeightXRPRIOffer"
        },
        {
            "name": "receive",
            "baseName": "receive",
            "type": "ListTransactionsByBlockHeightXRPRIReceive"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHeightXRPRIValue"
        }
    ];
    return ListTransactionsByBlockHeightXRPRI;
}());
exports.ListTransactionsByBlockHeightXRPRI = ListTransactionsByBlockHeightXRPRI;
//# sourceMappingURL=listTransactionsByBlockHeightXRPRI.js.map