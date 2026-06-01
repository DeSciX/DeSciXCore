"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRP401Response = void 0;
var GetTransactionDetailsByTransactionHashXRP401Response = (function () {
    function GetTransactionDetailsByTransactionHashXRP401Response() {
    }
    GetTransactionDetailsByTransactionHashXRP401Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRP401Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRP401Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRP401Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashXRPE401"
        }
    ];
    return GetTransactionDetailsByTransactionHashXRP401Response;
}());
exports.GetTransactionDetailsByTransactionHashXRP401Response = GetTransactionDetailsByTransactionHashXRP401Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRP401Response.js.map