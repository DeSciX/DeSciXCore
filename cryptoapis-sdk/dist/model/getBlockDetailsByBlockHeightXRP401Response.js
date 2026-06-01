"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRP401Response = void 0;
var GetBlockDetailsByBlockHeightXRP401Response = (function () {
    function GetBlockDetailsByBlockHeightXRP401Response() {
    }
    GetBlockDetailsByBlockHeightXRP401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRP401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRP401Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRP401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightXRPE401"
        }
    ];
    return GetBlockDetailsByBlockHeightXRP401Response;
}());
exports.GetBlockDetailsByBlockHeightXRP401Response = GetBlockDetailsByBlockHeightXRP401Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRP401Response.js.map