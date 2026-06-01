"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightXRP400Response = void 0;
var GetBlockDetailsByBlockHeightXRP400Response = (function () {
    function GetBlockDetailsByBlockHeightXRP400Response() {
    }
    GetBlockDetailsByBlockHeightXRP400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightXRP400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightXRP400Response.discriminator = undefined;
    GetBlockDetailsByBlockHeightXRP400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightXRPE400"
        }
    ];
    return GetBlockDetailsByBlockHeightXRP400Response;
}());
exports.GetBlockDetailsByBlockHeightXRP400Response = GetBlockDetailsByBlockHeightXRP400Response;
//# sourceMappingURL=getBlockDetailsByBlockHeightXRP400Response.js.map