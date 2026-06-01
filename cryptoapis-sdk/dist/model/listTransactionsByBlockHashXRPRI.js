"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRPRI = void 0;
var ListTransactionsByBlockHashXRPRI = (function () {
    function ListTransactionsByBlockHashXRPRI() {
    }
    ListTransactionsByBlockHashXRPRI.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRPRI.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRPRI.discriminator = undefined;
    ListTransactionsByBlockHashXRPRI.attributeTypeMap = [
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
            "name": "offer",
            "baseName": "offer",
            "type": "ListTransactionsByBlockHashXRPRIOffer"
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
            "type": "ListTransactionsByBlockHashXRPRIFee"
        },
        {
            "name": "receive",
            "baseName": "receive",
            "type": "ListTransactionsByBlockHashXRPRIReceive"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListTransactionsByBlockHashXRPRIValue"
        }
    ];
    return ListTransactionsByBlockHashXRPRI;
}());
exports.ListTransactionsByBlockHashXRPRI = ListTransactionsByBlockHashXRPRI;
//# sourceMappingURL=listTransactionsByBlockHashXRPRI.js.map