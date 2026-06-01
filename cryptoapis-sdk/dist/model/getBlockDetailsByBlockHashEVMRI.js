"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVMRI = void 0;
var GetBlockDetailsByBlockHashEVMRI = (function () {
    function GetBlockDetailsByBlockHashEVMRI() {
    }
    GetBlockDetailsByBlockHashEVMRI.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVMRI.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVMRI.discriminator = undefined;
    GetBlockDetailsByBlockHashEVMRI.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashEVMRI;
}());
exports.GetBlockDetailsByBlockHashEVMRI = GetBlockDetailsByBlockHashEVMRI;
//# sourceMappingURL=getBlockDetailsByBlockHashEVMRI.js.map