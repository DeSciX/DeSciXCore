"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMinedDataItem = void 0;
var BlockMinedDataItem = (function () {
    function BlockMinedDataItem() {
    }
    BlockMinedDataItem.getAttributeTypeMap = function () {
        return BlockMinedDataItem.attributeTypeMap;
    };
    BlockMinedDataItem.discriminator = undefined;
    BlockMinedDataItem.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        }
    ];
    return BlockMinedDataItem;
}());
exports.BlockMinedDataItem = BlockMinedDataItem;
//# sourceMappingURL=blockMinedDataItem.js.map