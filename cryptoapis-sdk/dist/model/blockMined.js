"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockMined = void 0;
var BlockMined = (function () {
    function BlockMined() {
    }
    BlockMined.getAttributeTypeMap = function () {
        return BlockMined.attributeTypeMap;
    };
    BlockMined.discriminator = undefined;
    BlockMined.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "idempotencyKey",
            "baseName": "idempotencyKey",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "BlockMinedData"
        }
    ];
    return BlockMined;
}());
exports.BlockMined = BlockMined;
//# sourceMappingURL=blockMined.js.map