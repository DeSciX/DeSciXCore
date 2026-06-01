"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRPRI = void 0;
var GetBlockDetailsByBlockHeightXRPRI = (function () {
    function GetBlockDetailsByBlockHeightXRPRI() {
    }
    GetBlockDetailsByBlockHeightXRPRI.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRPRI.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRPRI.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRPRI.attributeTypeMap = [
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
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "totalCoins",
            "baseName": "totalCoins",
            "type": "GetBlockDetailsByBlockHeightXRPRITotalCoins"
        },
        {
            "name": "totalFees",
            "baseName": "totalFees",
            "type": "GetBlockDetailsByBlockHashXRPRITotalFees"
        },
        {
            "name": "transactionsCount",
            "baseName": "transactionsCount",
            "type": "number"
        }
    ];
    return GetBlockDetailsByBlockHeightXRPRI;
}());
exports.GetBlockDetailsByBlockHeightXRPRI = GetBlockDetailsByBlockHeightXRPRI;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRPRI.js.map