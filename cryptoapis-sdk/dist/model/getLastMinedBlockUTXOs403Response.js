"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOs403Response = void 0;
var GetLastMinedBlockUTXOs403Response = (function () {
    function GetLastMinedBlockUTXOs403Response() {
    }
    GetLastMinedBlockUTXOs403Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOs403Response.attributeTypeMap;
    };
    GetLastMinedBlockUTXOs403Response.discriminator = undefined;
    GetLastMinedBlockUTXOs403Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockUTXOsE403"
        }
    ];
    return GetLastMinedBlockUTXOs403Response;
}());
exports.GetLastMinedBlockUTXOs403Response = GetLastMinedBlockUTXOs403Response;
//# sourceMappingURL=getLastMinedBlockUTXOs403Response.js.map