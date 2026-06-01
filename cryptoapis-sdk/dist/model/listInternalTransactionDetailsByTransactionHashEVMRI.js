"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionDetailsByTransactionHashEVMRI = void 0;
var ListInternalTransactionDetailsByTransactionHashEVMRI = (function () {
    function ListInternalTransactionDetailsByTransactionHashEVMRI() {
    }
    ListInternalTransactionDetailsByTransactionHashEVMRI.getAttributeTypeMap = function () {
        return ListInternalTransactionDetailsByTransactionHashEVMRI.attributeTypeMap;
    };
    ListInternalTransactionDetailsByTransactionHashEVMRI.discriminator = undefined;
    ListInternalTransactionDetailsByTransactionHashEVMRI.attributeTypeMap = [
        {
            "name": "operationId",
            "baseName": "operationId",
            "type": "string"
        },
        {
            "name": "operationType",
            "baseName": "operationType",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListInternalTransactionDetailsByTransactionHashEVMRIValue"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        }
    ];
    return ListInternalTransactionDetailsByTransactionHashEVMRI;
}());
exports.ListInternalTransactionDetailsByTransactionHashEVMRI = ListInternalTransactionDetailsByTransactionHashEVMRI;
//# sourceMappingURL=listInternalTransactionDetailsByTransactionHashEVMRI.js.map