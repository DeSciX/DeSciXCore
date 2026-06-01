"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPR = void 0;
var ListLatestMinedBlocksXRPR = (function () {
    function ListLatestMinedBlocksXRPR() {
    }
    ListLatestMinedBlocksXRPR.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPR.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPR.discriminator = undefined;
    ListLatestMinedBlocksXRPR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListLatestMinedBlocksXRPRData"
        }
    ];
    return ListLatestMinedBlocksXRPR;
}());
exports.ListLatestMinedBlocksXRPR = ListLatestMinedBlocksXRPR;
//# sourceMappingURL=listLatestMinedBlocksXRPR.js.map