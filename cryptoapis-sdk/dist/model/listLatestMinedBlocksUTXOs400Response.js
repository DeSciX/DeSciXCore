"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOs400Response = void 0;
var ListLatestMinedBlocksUTXOs400Response = (function () {
    function ListLatestMinedBlocksUTXOs400Response() {
    }
    ListLatestMinedBlocksUTXOs400Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOs400Response.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOs400Response.discriminator = undefined;
    ListLatestMinedBlocksUTXOs400Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksUTXOsE400"
        }
    ];
    return ListLatestMinedBlocksUTXOs400Response;
}());
exports.ListLatestMinedBlocksUTXOs400Response = ListLatestMinedBlocksUTXOs400Response;
//# sourceMappingURL=listLatestMinedBlocksUTXOs400Response.js.map