"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRPRI = void 0;
var GetTransactionDetailsByTransactionHashXRPRI = (function () {
    function GetTransactionDetailsByTransactionHashXRPRI() {
    }
    GetTransactionDetailsByTransactionHashXRPRI.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRPRI.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRPRI.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRPRI.attributeTypeMap = [
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
            "name": "fee",
            "baseName": "fee",
            "type": "GetTransactionDetailsByTransactionHashXRPRIFee"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "offer",
            "baseName": "offer",
            "type": "GetTransactionDetailsByTransactionHashXRPRIOffer"
        },
        {
            "name": "positionInBlock",
            "baseName": "positionInBlock",
            "type": "string"
        },
        {
            "name": "receive",
            "baseName": "receive",
            "type": "GetTransactionDetailsByTransactionHashXRPRIReceive"
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
            "name": "value",
            "baseName": "value",
            "type": "GetTransactionDetailsByTransactionHashXRPRIValue"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "GetTransactionDetailsByTransactionHashXRPRIMinedInBlock"
        }
    ];
    return GetTransactionDetailsByTransactionHashXRPRI;
}());
exports.GetTransactionDetailsByTransactionHashXRPRI = GetTransactionDetailsByTransactionHashXRPRI;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRPRI.js.map