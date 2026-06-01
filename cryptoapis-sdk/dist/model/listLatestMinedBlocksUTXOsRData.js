"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOsRData = void 0;
var ListLatestMinedBlocksUTXOsRData = (function () {
    function ListLatestMinedBlocksUTXOsRData() {
    }
    ListLatestMinedBlocksUTXOsRData.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOsRData.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOsRData.discriminator = undefined;
    ListLatestMinedBlocksUTXOsRData.attributeTypeMap = [
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
            "type": "Array<ListLatestMinedBlocksUTXOsRI>"
        }
    ];
    return ListLatestMinedBlocksUTXOsRData;
}());
exports.ListLatestMinedBlocksUTXOsRData = ListLatestMinedBlocksUTXOsRData;
//# sourceMappingURL=listLatestMinedBlocksUTXOsRData.js.map