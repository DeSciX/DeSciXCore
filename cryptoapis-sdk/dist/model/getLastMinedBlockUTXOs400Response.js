"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOs400Response = void 0;
var GetLastMinedBlockUTXOs400Response = (function () {
    function GetLastMinedBlockUTXOs400Response() {
    }
    GetLastMinedBlockUTXOs400Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOs400Response.attributeTypeMap;
    };
    GetLastMinedBlockUTXOs400Response.discriminator = undefined;
    GetLastMinedBlockUTXOs400Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockUTXOsE400"
        }
    ];
    return GetLastMinedBlockUTXOs400Response;
}());
exports.GetLastMinedBlockUTXOs400Response = GetLastMinedBlockUTXOs400Response;
//# sourceMappingURL=getLastMinedBlockUTXOs400Response.js.map