"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVMR = void 0;
var ListLatestMinedBlocksEVMR = (function () {
    function ListLatestMinedBlocksEVMR() {
    }
    ListLatestMinedBlocksEVMR.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVMR.attributeTypeMap;
    };
    ListLatestMinedBlocksEVMR.discriminator = undefined;
    ListLatestMinedBlocksEVMR.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksEVMRData"
        }
    ];
    return ListLatestMinedBlocksEVMR;
}());
exports.ListLatestMinedBlocksEVMR = ListLatestMinedBlocksEVMR;
//# sourceMappingURL=listLatestMinedBlocksEVMR.js.map