"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVM401Response = void 0;
var ListTokensTransfersByTransactionHashEVM401Response = (function () {
    function ListTokensTransfersByTransactionHashEVM401Response() {
    }
    ListTokensTransfersByTransactionHashEVM401Response.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVM401Response.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVM401Response.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVM401Response.attributeTypeMap = [
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
            "type": "ListTokensTransfersByTransactionHashEVME401"
        }
    ];
    return ListTokensTransfersByTransactionHashEVM401Response;
}());
exports.ListTokensTransfersByTransactionHashEVM401Response = ListTokensTransfersByTransactionHashEVM401Response;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVM401Response.js.map