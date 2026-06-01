"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVM403Response = void 0;
var ListTokensTransfersByTransactionHashEVM403Response = (function () {
    function ListTokensTransfersByTransactionHashEVM403Response() {
    }
    ListTokensTransfersByTransactionHashEVM403Response.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVM403Response.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVM403Response.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVM403Response.attributeTypeMap = [
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
            "type": "ListTokensTransfersByTransactionHashEVME403"
        }
    ];
    return ListTokensTransfersByTransactionHashEVM403Response;
}());
exports.ListTokensTransfersByTransactionHashEVM403Response = ListTokensTransfersByTransactionHashEVM403Response;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVM403Response.js.map