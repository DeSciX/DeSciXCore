"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspa400Response = void 0;
var GetTransactionDetailsByTransactionIdKaspa400Response = (function () {
    function GetTransactionDetailsByTransactionIdKaspa400Response() {
    }
    GetTransactionDetailsByTransactionIdKaspa400Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspa400Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspa400Response.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspa400Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionIdKaspaE400"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspa400Response;
}());
exports.GetTransactionDetailsByTransactionIdKaspa400Response = GetTransactionDetailsByTransactionIdKaspa400Response;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspa400Response.js.map