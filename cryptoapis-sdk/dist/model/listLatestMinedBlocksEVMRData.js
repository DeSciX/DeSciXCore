"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVMRData = void 0;
var ListLatestMinedBlocksEVMRData = (function () {
    function ListLatestMinedBlocksEVMRData() {
    }
    ListLatestMinedBlocksEVMRData.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVMRData.attributeTypeMap;
    };
    ListLatestMinedBlocksEVMRData.discriminator = undefined;
    ListLatestMinedBlocksEVMRData.attributeTypeMap = [
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
            "type": "Array<ListLatestMinedBlocksEVMRI>"
        }
    ];
    return ListLatestMinedBlocksEVMRData;
}());
exports.ListLatestMinedBlocksEVMRData = ListLatestMinedBlocksEVMRData;
//# sourceMappingURL=listLatestMinedBlocksEVMRData.js.map