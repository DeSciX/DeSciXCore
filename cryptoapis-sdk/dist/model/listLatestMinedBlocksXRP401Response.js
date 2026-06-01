"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksXRP401Response = void 0;
var ListLatestMinedBlocksXRP401Response = (function () {
    function ListLatestMinedBlocksXRP401Response() {
    }
    ListLatestMinedBlocksXRP401Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksXRP401Response.attributeTypeMap;
    };
    ListLatestMinedBlocksXRP401Response.discriminator = undefined;
    ListLatestMinedBlocksXRP401Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksXRPE401"
        }
    ];
    return ListLatestMinedBlocksXRP401Response;
}());
exports.ListLatestMinedBlocksXRP401Response = ListLatestMinedBlocksXRP401Response;
//# sourceMappingURL=listLatestMinedBlocksXRP401Response.js.map