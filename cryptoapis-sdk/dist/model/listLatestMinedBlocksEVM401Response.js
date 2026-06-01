"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLatestMinedBlocksEVM401Response = void 0;
var ListLatestMinedBlocksEVM401Response = (function () {
    function ListLatestMinedBlocksEVM401Response() {
    }
    ListLatestMinedBlocksEVM401Response.getAttributeTypeMap = function () {
        return ListLatestMinedBlocksEVM401Response.attributeTypeMap;
    };
    ListLatestMinedBlocksEVM401Response.discriminator = undefined;
    ListLatestMinedBlocksEVM401Response.attributeTypeMap = [
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
            "type": "ListLatestMinedBlocksEVME401"
        }
    ];
    return ListLatestMinedBlocksEVM401Response;
}());
exports.ListLatestMinedBlocksEVM401Response = ListLatestMinedBlocksEVM401Response;
//# sourceMappingURL=listLatestMinedBlocksEVM401Response.js.map