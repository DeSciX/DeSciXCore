"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRP403Response = void 0;
var GetBlockDetailsByBlockHeightXRP403Response = (function () {
    function GetBlockDetailsByBlockHeightXRP403Response() {
    }
    GetBlockDetailsByBlockHeightXRP403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRP403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRP403Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRP403Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightXRPE403"
        }
    ];
    return GetBlockDetailsByBlockHeightXRP403Response;
}());
exports.GetBlockDetailsByBlockHeightXRP403Response = GetBlockDetailsByBlockHeightXRP403Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRP403Response.js.map