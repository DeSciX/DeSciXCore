"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspa403Response = void 0;
var GetTransactionDetailsByTransactionIdKaspa403Response = (function () {
    function GetTransactionDetailsByTransactionIdKaspa403Response() {
    }
    GetTransactionDetailsByTransactionIdKaspa403Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspa403Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspa403Response.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspa403Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionIdKaspaE403"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspa403Response;
}());
exports.GetTransactionDetailsByTransactionIdKaspa403Response = GetTransactionDetailsByTransactionIdKaspa403Response;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspa403Response.js.map