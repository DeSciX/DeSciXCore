"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRPRI = void 0;
var GetLatestMinedBlockXRPRI = (function () {
    function GetLatestMinedBlockXRPRI() {
    }
    GetLatestMinedBlockXRPRI.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRPRI.attributeTypeMap;
    };
    GetLatestMinedBlockXRPRI.discriminator = undefined;
    GetLatestMinedBlockXRPRI.attributeTypeMap = [
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
            "name": "transactionsCount",
            "baseName": "transactionsCount",
            "type": "number"
        },
        {
            "name": "totalCoins",
            "baseName": "totalCoins",
            "type": "GetLatestMinedBlockXRPRITotalCoins"
        },
        {
            "name": "totalFees",
            "baseName": "totalFees",
            "type": "GetLatestMinedBlockXRPRITotalFees"
        }
    ];
    return GetLatestMinedBlockXRPRI;
}());
exports.GetLatestMinedBlockXRPRI = GetLatestMinedBlockXRPRI;
//# sourceMappingURL=getLatestMinedBlockXRPRI.js.map