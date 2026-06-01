"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOsRI = void 0;
var GetBlockDetailsByBlockHashUTXOsRI = (function () {
    function GetBlockDetailsByBlockHashUTXOsRI() {
    }
    GetBlockDetailsByBlockHashUTXOsRI.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOsRI.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOsRI.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOsRI.attributeTypeMap = [
        {
            "name": "bits",
            "baseName": "bits",
            "type": "number"
        },
        {
            "name": "chainwork",
            "baseName": "chainwork",
            "type": "string"
        },
        {
            "name": "difficulty",
            "baseName": "difficulty",
            "type": "number"
        },
        {
            "name": "merkleRoot",
            "baseName": "merkleRoot",
            "type": "string"
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
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        },
        {
            "name": "nextBlockHash",
            "baseName": "nextBlockHash",
            "type": "string"
        },
        {
            "name": "previousBlockHash",
            "baseName": "previousBlockHash",
            "type": "string"
        },
        {
            "name": "strippedSize",
            "baseName": "strippedSize",
            "type": "number"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "transactionsCount",
            "baseName": "transactionsCount",
            "type": "number"
        },
        {
            "name": "versionHex",
            "baseName": "versionHex",
            "type": "string"
        },
        {
            "name": "weight",
            "baseName": "weight",
            "type": "number"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOsRI;
}());
exports.GetBlockDetailsByBlockHashUTXOsRI = GetBlockDetailsByBlockHashUTXOsRI;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOsRI.js.map