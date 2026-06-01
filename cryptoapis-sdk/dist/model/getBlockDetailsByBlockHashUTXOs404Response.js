"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOs404Response = void 0;
var GetBlockDetailsByBlockHashUTXOs404Response = (function () {
    function GetBlockDetailsByBlockHashUTXOs404Response() {
    }
    GetBlockDetailsByBlockHashUTXOs404Response.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOs404Response.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOs404Response.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOs404Response.attributeTypeMap = [
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
            "type": "BlockchainDataBlockNotFound"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOs404Response;
}());
exports.GetBlockDetailsByBlockHashUTXOs404Response = GetBlockDetailsByBlockHashUTXOs404Response;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOs404Response.js.map