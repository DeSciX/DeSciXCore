"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVMRI = void 0;
var ListLatestMinedBlocksEVMRI = (function () {
    function ListLatestMinedBlocksEVMRI() {
    }
    ListLatestMinedBlocksEVMRI.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVMRI.attributeTypeMap;
    };
    ListLatestMinedBlocksEVMRI.discriminator = undefined;
    ListLatestMinedBlocksEVMRI.attributeTypeMap = [
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
            "name": "extraData",
            "baseName": "extraData",
            "type": "string"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasUsed",
            "baseName": "gasUsed",
            "type": "number"
        },
        {
            "name": "minedInSeconds",
            "baseName": "minedInSeconds",
            "type": "number"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
        },
        {
            "name": "totalDifficulty",
            "baseName": "totalDifficulty",
            "type": "number"
        }
    ];
    return ListLatestMinedBlocksEVMRI;
}());
exports.ListLatestMinedBlocksEVMRI = ListLatestMinedBlocksEVMRI;
//# sourceMappingURL=listLatestMinedBlocksEVMRI.js.map