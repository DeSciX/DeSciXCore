"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVMR = void 0;
var ListInternalTransactionDetailsByTransactionHashEVMR = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVMR() {
    }
    ListInternalTransactionDetailsByTransactionHashEVMR.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVMR.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVMR.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVMR.attributeTypeMap = [
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
            "type": "ListInternalTransactionDetailsByTransactionHashEVMRData"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVMR;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVMR = ListInternalTransactionDetailsByTransactionHashEVMR;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVMR.js.map