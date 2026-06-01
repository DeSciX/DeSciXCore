"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashXRP403Response = void 0;
var GetTransactionDetailsByTransactionHashXRP403Response = (function () {
    function GetTransactionDetailsByTransactionHashXRP403Response() {
    }
    GetTransactionDetailsByTransactionHashXRP403Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashXRP403Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashXRP403Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashXRP403Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashXRPE403"
        }
    ];
    return GetTransactionDetailsByTransactionHashXRP403Response;
}());
exports.GetTransactionDetailsByTransactionHashXRP403Response = GetTransactionDetailsByTransactionHashXRP403Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashXRP403Response.js.map