"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOsRI = void 0;
var GetBlockDetailsByBlockHeightUTXOsRI = (function () {
    function GetBlockDetailsByBlockHeightUTXOsRI() {
    }
    GetBlockDetailsByBlockHeightUTXOsRI.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOsRI.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOsRI.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOsRI.attributeTypeMap = [
        {
            "name": "bits",
            "baseName": "bits",
            "type": "number"
        },
        {
            "name": "chainwork",
            "baseName": "chainwork",
            "type": "number"
        },
        {
            "name": "difficulty",
            "baseName": "difficulty",
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
            "name": "merkleRoot",
            "baseName": "merkleRoot",
            "type": "string"
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
            "name": "transactionsCount",
            "baseName": "transactionsCount",
            "type": "number"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "number"
        },
        {
            "name": "strippedSize",
            "baseName": "strippedSize",
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
    return GetBlockDetailsByBlockHeightUTXOsRI;
}());
exports.GetBlockDetailsByBlockHeightUTXOsRI = GetBlockDetailsByBlockHeightUTXOsRI;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOsRI.js.map