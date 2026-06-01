"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRP403Response = void 0;
var GetBlockDetailsByBlockHashXRP403Response = (function () {
    function GetBlockDetailsByBlockHashXRP403Response() {
    }
    GetBlockDetailsByBlockHashXRP403Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRP403Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRP403Response.discriminator = undefined;
    GetBlockDetailsByBlockHashXRP403Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashXRPE403"
        }
    ];
    return GetBlockDetailsByBlockHashXRP403Response;
}());
exports.GetBlockDetailsByBlockHashXRP403Response = GetBlockDetailsByBlockHashXRP403Response;
//# sourceMappingURL=getBlockDetailsByBlockHashXRP403Response.js.map