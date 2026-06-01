"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMinedData = void 0;
var BlockMinedData = (function () {
    function BlockMinedData() {
    }
    BlockMinedData.getAttributeTypeMap = function () {
        return BlockMinedData.attributeTypeMap;
    };
    BlockMinedData.discriminator = undefined;
    BlockMinedData.attributeTypeMap = [
        {
            "name": "product",
            "baseName": "product",
            "type": "string"
        },
        {
            "name": "event",
            "baseName": "event",
            "type": "string"
        },
        {
            "name": "item",
            "baseName": "item",
            "type": "BlockMinedDataItem"
        }
    ];
    return BlockMinedData;
}());
exports.BlockMinedData = BlockMinedData;
//# sourceMappingURL=blockMinedData.js.map