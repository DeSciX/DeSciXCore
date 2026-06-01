"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashEVM400Response = void 0;
var GetTransactionDetailsByTransactionHashEVM400Response = (function () {
    function GetTransactionDetailsByTransactionHashEVM400Response() {
    }
    GetTransactionDetailsByTransactionHashEVM400Response.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashEVM400Response.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashEVM400Response.discriminator = undefined;
    GetTransactionDetailsByTransactionHashEVM400Response.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashEVME400"
        }
    ];
    return GetTransactionDetailsByTransactionHashEVM400Response;
}());
exports.GetTransactionDetailsByTransactionHashEVM400Response = GetTransactionDetailsByTransactionHashEVM400Response;
//# sourceMappingURL=getTransactionDetailsByTransactionHashEVM400Response.js.map