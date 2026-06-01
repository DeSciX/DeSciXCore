"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVM400Response = void 0;
var ListLatestMinedBlocksEVM400Response = (function () {
    function ListLatestMinedBlocksEVM400Response() {
    }
    ListLatestMinedBlocksEVM400Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVM400Response.attributeTypeMap;
    };
    ListLatestMinedBlocksEVM400Response.discriminator = undefined;
    ListLatestMinedBlocksEVM400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListLatestMinedBlocksEVME400"
        }
    ];
    return ListLatestMinedBlocksEVM400Response;
}());
exports.ListLatestMinedBlocksEVM400Response = ListLatestMinedBlocksEVM400Response;
//# sourceMappingURL=listLatestMinedBlocksEVM400Response.js.map