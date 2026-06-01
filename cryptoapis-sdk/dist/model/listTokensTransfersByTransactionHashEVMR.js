"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensTransfersByTransactionHashEVMR = void 0;
var ListTokensTransfersByTransactionHashEVMR = (function () {
    function ListTokensTransfersByTransactionHashEVMR() {
    }
    ListTokensTransfersByTransactionHashEVMR.getAttributeTypeMap = function () {
        return ListTokensTransfersByTransactionHashEVMR.attributeTypeMap;
    };
    ListTokensTransfersByTransactionHashEVMR.discriminator = undefined;
    ListTokensTransfersByTransactionHashEVMR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "ListTokensTransfersByTransactionHashEVMRData"
        }
    ];
    return ListTokensTransfersByTransactionHashEVMR;
}());
exports.ListTokensTransfersByTransactionHashEVMR = ListTokensTransfersByTransactionHashEVMR;
//# sourceMappingURL=listTokensTransfersByTransactionHashEVMR.js.map