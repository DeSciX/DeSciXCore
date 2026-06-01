"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRP400Response = void 0;
var GetTransactionDetailsByTransactionHashXRP400Response = (function () {
    function GetTransactionDetailsByTransactionHashXRP400Response() {
    }
    GetTransactionDetailsByTransactionHashXRP400Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRP400Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRP400Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRP400Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashXRPE400"
        }
    ];
    return GetTransactionDetailsByTransactionHashXRP400Response;
}());
exports.GetTransactionDetailsByTransactionHashXRP400Response = GetTransactionDetailsByTransactionHashXRP400Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRP400Response.js.map