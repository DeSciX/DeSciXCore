"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashXRP401Response = void 0;
var GetBlockDetailsByBlockHashXRP401Response = (function () {
    function GetBlockDetailsByBlockHashXRP401Response() {
    }
    GetBlockDetailsByBlockHashXRP401Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashXRP401Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashXRP401Response.discriminator = undefined;
    GetBlockDetailsByBlockHashXRP401Response.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashXRPE401"
        }
    ];
    return GetBlockDetailsByBlockHashXRP401Response;
}());
exports.GetBlockDetailsByBlockHashXRP401Response = GetBlockDetailsByBlockHashXRP401Response;
//# sourceMappingURL=getBlockDetailsByBlockHashXRP401Response.js.map