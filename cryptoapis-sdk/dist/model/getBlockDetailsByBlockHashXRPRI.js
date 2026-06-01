"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRPRI = void 0;
var GetBlockDetailsByBlockHashXRPRI = (function () {
    function GetBlockDetailsByBlockHashXRPRI() {
    }
    GetBlockDetailsByBlockHashXRPRI.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRPRI.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRPRI.discriminator = undefined;
    GetBlockDetailsByBlockHashXRPRI.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashXRPRITotalCoins"
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
    return GetBlockDetailsByBlockHashXRPRI;
}());
exports.GetBlockDetailsByBlockHashXRPRI = GetBlockDetailsByBlockHashXRPRI;
//# sourceMappingURL=getBlockDetailsByBlockHashXRPRI.js.map