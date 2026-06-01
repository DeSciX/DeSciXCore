"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVM403Response = void 0;
var ListInternalTransactionDetailsByTransactionHashEVM403Response = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVM403Response() {
    }
    ListInternalTransactionDetailsByTransactionHashEVM403Response.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVM403Response.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVM403Response.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVM403Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionDetailsByTransactionHashEVME403"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVM403Response;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVM403Response = ListInternalTransactionDetailsByTransactionHashEVM403Response;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVM403Response.js.map