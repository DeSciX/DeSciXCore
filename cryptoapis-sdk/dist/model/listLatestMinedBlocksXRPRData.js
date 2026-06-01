"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRPRData = void 0;
var ListLatestMinedBlocksXRPRData = (function () {
    function ListLatestMinedBlocksXRPRData() {
    }
    ListLatestMinedBlocksXRPRData.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRPRData.attributeTypeMap;
    };
    ListLatestMinedBlocksXRPRData.discriminator = undefined;
    ListLatestMinedBlocksXRPRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListLatestMinedBlocksXRPRI>"
        }
    ];
    return ListLatestMinedBlocksXRPRData;
}());
exports.ListLatestMinedBlocksXRPRData = ListLatestMinedBlocksXRPRData;
//# sourceMappingURL=listLatestMinedBlocksXRPRData.js.map