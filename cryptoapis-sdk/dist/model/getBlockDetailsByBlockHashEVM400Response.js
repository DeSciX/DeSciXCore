"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVM400Response = void 0;
var GetBlockDetailsByBlockHashEVM400Response = (function () {
    function GetBlockDetailsByBlockHashEVM400Response() {
    }
    GetBlockDetailsByBlockHashEVM400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVM400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVM400Response.discriminator = undefined;
    GetBlockDetailsByBlockHashEVM400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashEVME400"
        }
    ];
    return GetBlockDetailsByBlockHashEVM400Response;
}());
exports.GetBlockDetailsByBlockHashEVM400Response = GetBlockDetailsByBlockHashEVM400Response;
//# sourceMappingURL=getBlockDetailsByBlockHashEVM400Response.js.map