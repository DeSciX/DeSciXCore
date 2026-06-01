"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPRI = void 0;
var ListLatestMinedBlocksXRPRI = (function () {
    function ListLatestMinedBlocksXRPRI() {
    }
    ListLatestMinedBlocksXRPRI.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPRI.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPRI.discriminator = undefined;
    ListLatestMinedBlocksXRPRI.attributeTypeMap = [
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
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "totalFees",
            "baseName": "totalFees",
            "type": "ListLatestMinedBlocksXRPRITotalFees"
        },
        {
            "name": "transactionsCount",
            "baseName": "transactionsCount",
            "type": "number"
        },
        {
            "name": "totalCoins",
            "baseName": "totalCoins",
            "type": "ListLatestMinedBlocksXRPRITotalCoins"
        }
    ];
    return ListLatestMinedBlocksXRPRI;
}());
exports.ListLatestMinedBlocksXRPRI = ListLatestMinedBlocksXRPRI;
//# sourceMappingURL=listLatestMinedBlocksXRPRI.js.map