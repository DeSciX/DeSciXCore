"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVM401Response = void 0;
var GetLastMinedBlockEVM401Response = (function () {
    function GetLastMinedBlockEVM401Response() {
    }
    GetLastMinedBlockEVM401Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVM401Response.attributeTypeMap;
    };
    GetLastMinedBlockEVM401Response.discriminator = undefined;
    GetLastMinedBlockEVM401Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockEVME401"
        }
    ];
    return GetLastMinedBlockEVM401Response;
}());
exports.GetLastMinedBlockEVM401Response = GetLastMinedBlockEVM401Response;
//# sourceMappingURL=getLastMinedBlockEVM401Response.js.map