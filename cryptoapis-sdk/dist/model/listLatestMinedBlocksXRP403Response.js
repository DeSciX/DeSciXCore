"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRP403Response = void 0;
var ListLatestMinedBlocksXRP403Response = (function () {
    function ListLatestMinedBlocksXRP403Response() {
    }
    ListLatestMinedBlocksXRP403Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRP403Response.attributeTypeMap;
    };
    ListLatestMinedBlocksXRP403Response.discriminator = undefined;
    ListLatestMinedBlocksXRP403Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksXRPE403"
        }
    ];
    return ListLatestMinedBlocksXRP403Response;
}());
exports.ListLatestMinedBlocksXRP403Response = ListLatestMinedBlocksXRP403Response;
//# sourceMappingURL=listLatestMinedBlocksXRP403Response.js.map