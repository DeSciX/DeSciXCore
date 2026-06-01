"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionIdKaspa401Response = void 0;
var GetTransactionDetailsByTransactionIdKaspa401Response = (function () {
    function GetTransactionDetailsByTransactionIdKaspa401Response() {
    }
    GetTransactionDetailsByTransactionIdKaspa401Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionIdKaspa401Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionIdKaspa401Response.discriminator = undefined;
    GetTransactionDetailsByTransactionIdKaspa401Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionIdKaspaE401"
        }
    ];
    return GetTransactionDetailsByTransactionIdKaspa401Response;
}());
exports.GetTransactionDetailsByTransactionIdKaspa401Response = GetTransactionDetailsByTransactionIdKaspa401Response;
//# sourceMappingURL=getTransactionDetailsByTransactionIdKaspa401Response.js.map