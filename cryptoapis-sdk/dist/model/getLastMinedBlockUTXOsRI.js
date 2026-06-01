"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOsRI = void 0;
var GetLastMinedBlockUTXOsRI = (function () {
    function GetLastMinedBlockUTXOsRI() {
    }
    GetLastMinedBlockUTXOsRI.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOsRI.attributeTypeMap;
    };
    GetLastMinedBlockUTXOsRI.discriminator = undefined;
    GetLastMinedBlockUTXOsRI.attributeTypeMap = [
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
    return GetLastMinedBlockUTXOsRI;
}());
exports.GetLastMinedBlockUTXOsRI = GetLastMinedBlockUTXOsRI;
//# sourceMappingURL=getLastMinedBlockUTXOsRI.js.map