"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOs401Response = void 0;
var GetLastMinedBlockUTXOs401Response = (function () {
    function GetLastMinedBlockUTXOs401Response() {
    }
    GetLastMinedBlockUTXOs401Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOs401Response.attributeTypeMap;
    };
    GetLastMinedBlockUTXOs401Response.discriminator = undefined;
    GetLastMinedBlockUTXOs401Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockUTXOsE401"
        }
    ];
    return GetLastMinedBlockUTXOs401Response;
}());
exports.GetLastMinedBlockUTXOs401Response = GetLastMinedBlockUTXOs401Response;
//# sourceMappingURL=getLastMinedBlockUTXOs401Response.js.map