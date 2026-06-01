"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVM403Response = void 0;
var ListLatestMinedBlocksEVM403Response = (function () {
    function ListLatestMinedBlocksEVM403Response() {
    }
    ListLatestMinedBlocksEVM403Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVM403Response.attributeTypeMap;
    };
    ListLatestMinedBlocksEVM403Response.discriminator = undefined;
    ListLatestMinedBlocksEVM403Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksEVME403"
        }
    ];
    return ListLatestMinedBlocksEVM403Response;
}());
exports.ListLatestMinedBlocksEVM403Response = ListLatestMinedBlocksEVM403Response;
//# sourceMappingURL=listLatestMinedBlocksEVM403Response.js.map