"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRP400Response = void 0;
var GetBlockDetailsByBlockHashXRP400Response = (function () {
    function GetBlockDetailsByBlockHashXRP400Response() {
    }
    GetBlockDetailsByBlockHashXRP400Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRP400Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRP400Response.discriminator = undefined;
    GetBlockDetailsByBlockHashXRP400Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashXRPE400"
        }
    ];
    return GetBlockDetailsByBlockHashXRP400Response;
}());
exports.GetBlockDetailsByBlockHashXRP400Response = GetBlockDetailsByBlockHashXRP400Response;
//# sourceMappingURL=getBlockDetailsByBlockHashXRP400Response.js.map