"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOsR = void 0;
var ListLatestMinedBlocksUTXOsR = (function () {
    function ListLatestMinedBlocksUTXOsR() {
    }
    ListLatestMinedBlocksUTXOsR.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOsR.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOsR.discriminator = undefined;
    ListLatestMinedBlocksUTXOsR.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksUTXOsRData"
        }
    ];
    return ListLatestMinedBlocksUTXOsR;
}());
exports.ListLatestMinedBlocksUTXOsR = ListLatestMinedBlocksUTXOsR;
//# sourceMappingURL=listLatestMinedBlocksUTXOsR.js.map