"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVM401Response = void 0;
var GetTransactionDetailsByTransactionHashEVM401Response = (function () {
    function GetTransactionDetailsByTransactionHashEVM401Response() {
    }
    GetTransactionDetailsByTransactionHashEVM401Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVM401Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVM401Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVM401Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashEVME401"
        }
    ];
    return GetTransactionDetailsByTransactionHashEVM401Response;
}());
exports.GetTransactionDetailsByTransactionHashEVM401Response = GetTransactionDetailsByTransactionHashEVM401Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVM401Response.js.map