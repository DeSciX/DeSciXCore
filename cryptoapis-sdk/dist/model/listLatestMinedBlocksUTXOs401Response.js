"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOs401Response = void 0;
var ListLatestMinedBlocksUTXOs401Response = (function () {
    function ListLatestMinedBlocksUTXOs401Response() {
    }
    ListLatestMinedBlocksUTXOs401Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOs401Response.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOs401Response.discriminator = undefined;
    ListLatestMinedBlocksUTXOs401Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksUTXOsE401"
        }
    ];
    return ListLatestMinedBlocksUTXOs401Response;
}());
exports.ListLatestMinedBlocksUTXOs401Response = ListLatestMinedBlocksUTXOs401Response;
//# sourceMappingURL=listLatestMinedBlocksUTXOs401Response.js.map