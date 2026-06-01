"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVM401Response = void 0;
var ListInternalTransactionDetailsByTransactionHashEVM401Response = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVM401Response() {
    }
    ListInternalTransactionDetailsByTransactionHashEVM401Response.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVM401Response.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVM401Response.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVM401Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionDetailsByTransactionHashEVME401"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVM401Response;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVM401Response = ListInternalTransactionDetailsByTransactionHashEVM401Response;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVM401Response.js.map