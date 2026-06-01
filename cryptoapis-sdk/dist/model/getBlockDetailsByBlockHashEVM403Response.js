"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVM403Response = void 0;
var GetBlockDetailsByBlockHashEVM403Response = (function () {
    function GetBlockDetailsByBlockHashEVM403Response() {
    }
    GetBlockDetailsByBlockHashEVM403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVM403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVM403Response.discriminator = undefined;
    GetBlockDetailsByBlockHashEVM403Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashEVME403"
        }
    ];
    return GetBlockDetailsByBlockHashEVM403Response;
}());
exports.GetBlockDetailsByBlockHashEVM403Response = GetBlockDetailsByBlockHashEVM403Response;
//# sourceMappingURL=getBlockDetailsByBlockHashEVM403Response.js.map