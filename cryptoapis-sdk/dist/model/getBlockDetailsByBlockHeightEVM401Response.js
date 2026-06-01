"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVM401Response = void 0;
var GetBlockDetailsByBlockHeightEVM401Response = (function () {
    function GetBlockDetailsByBlockHeightEVM401Response() {
    }
    GetBlockDetailsByBlockHeightEVM401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVM401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVM401Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVM401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightEVME401"
        }
    ];
    return GetBlockDetailsByBlockHeightEVM401Response;
}());
exports.GetBlockDetailsByBlockHeightEVM401Response = GetBlockDetailsByBlockHeightEVM401Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVM401Response.js.map