"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVM400Response = void 0;
var GetLastMinedBlockEVM400Response = (function () {
    function GetLastMinedBlockEVM400Response() {
    }
    GetLastMinedBlockEVM400Response.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVM400Response.attributeTypeMap;
    };
    GetLastMinedBlockEVM400Response.discriminator = undefined;
    GetLastMinedBlockEVM400Response.attributeTypeMap = [
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
            "type": "GetLastMinedBlockEVME400"
        }
    ];
    return GetLastMinedBlockEVM400Response;
}());
exports.GetLastMinedBlockEVM400Response = GetLastMinedBlockEVM400Response;
//# sourceMappingURL=getLastMinedBlockEVM400Response.js.map