"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVM403Response = void 0;
var GetTransactionDetailsByTransactionHashEVM403Response = (function () {
    function GetTransactionDetailsByTransactionHashEVM403Response() {
    }
    GetTransactionDetailsByTransactionHashEVM403Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVM403Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVM403Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVM403Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashEVME403"
        }
    ];
    return GetTransactionDetailsByTransactionHashEVM403Response;
}());
exports.GetTransactionDetailsByTransactionHashEVM403Response = GetTransactionDetailsByTransactionHashEVM403Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVM403Response.js.map