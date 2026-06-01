"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVM400Response = void 0;
var ListTokensTransfersByTransactionHashEVM400Response = (function () {
    function ListTokensTransfersByTransactionHashEVM400Response() {
    }
    ListTokensTransfersByTransactionHashEVM400Response.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVM400Response.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVM400Response.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVM400Response.attributeTypeMap = [
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
            "type": "ListTokensTransfersByTransactionHashEVME400"
        }
    ];
    return ListTokensTransfersByTransactionHashEVM400Response;
}());
exports.ListTokensTransfersByTransactionHashEVM400Response = ListTokensTransfersByTransactionHashEVM400Response;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVM400Response.js.map