"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksUTXOs403Response = void 0;
var ListLatestMinedBlocksUTXOs403Response = (function () {
    function ListLatestMinedBlocksUTXOs403Response() {
    }
    ListLatestMinedBlocksUTXOs403Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksUTXOs403Response.attributeTypeMap;
    };
    ListLatestMinedBlocksUTXOs403Response.discriminator = undefined;
    ListLatestMinedBlocksUTXOs403Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksUTXOsE403"
        }
    ];
    return ListLatestMinedBlocksUTXOs403Response;
}());
exports.ListLatestMinedBlocksUTXOs403Response = ListLatestMinedBlocksUTXOs403Response;
//# sourceMappingURL=listLatestMinedBlocksUTXOs403Response.js.map