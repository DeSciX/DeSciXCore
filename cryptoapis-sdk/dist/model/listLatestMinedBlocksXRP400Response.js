"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRP400Response = void 0;
var ListLatestMinedBlocksXRP400Response = (function () {
    function ListLatestMinedBlocksXRP400Response() {
    }
    ListLatestMinedBlocksXRP400Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRP400Response.attributeTypeMap;
    };
    ListLatestMinedBlocksXRP400Response.discriminator = undefined;
    ListLatestMinedBlocksXRP400Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksXRPE400"
        }
    ];
    return ListLatestMinedBlocksXRP400Response;
}());
exports.ListLatestMinedBlocksXRP400Response = ListLatestMinedBlocksXRP400Response;
//# sourceMappingURL=listLatestMinedBlocksXRP400Response.js.map