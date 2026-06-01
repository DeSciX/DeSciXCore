"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVM401Response = void 0;
var GetBlockDetailsByBlockHashEVM401Response = (function () {
    function GetBlockDetailsByBlockHashEVM401Response() {
    }
    GetBlockDetailsByBlockHashEVM401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVM401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVM401Response.discriminator = undefined;
    GetBlockDetailsByBlockHashEVM401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashEVME401"
        }
    ];
    return GetBlockDetailsByBlockHashEVM401Response;
}());
exports.GetBlockDetailsByBlockHashEVM401Response = GetBlockDetailsByBlockHashEVM401Response;
//# sourceMappingURL=getBlockDetailsByBlockHashEVM401Response.js.map