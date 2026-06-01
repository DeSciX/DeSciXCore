"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVM400Response = void 0;
var ListInternalTransactionDetailsByTransactionHashEVM400Response = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVM400Response() {
    }
    ListInternalTransactionDetailsByTransactionHashEVM400Response.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVM400Response.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVM400Response.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVM400Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionDetailsByTransactionHashEVME400"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVM400Response;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVM400Response = ListInternalTransactionDetailsByTransactionHashEVM400Response;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVM400Response.js.map