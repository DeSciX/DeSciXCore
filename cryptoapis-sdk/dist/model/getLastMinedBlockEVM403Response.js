"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVM403Response = void 0;
var GetLastMinedBlockEVM403Response = (function () {
    function GetLastMinedBlockEVM403Response() {
    }
    GetLastMinedBlockEVM403Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVM403Response.attributeTypeMap;
    };
    GetLastMinedBlockEVM403Response.discriminator = undefined;
    GetLastMinedBlockEVM403Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockEVME403"
        }
    ];
    return GetLastMinedBlockEVM403Response;
}());
exports.GetLastMinedBlockEVM403Response = GetLastMinedBlockEVM403Response;
//# sourceMappingURL=getLastMinedBlockEVM403Response.js.map