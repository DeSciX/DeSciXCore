"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVMRI = void 0;
var ListInternalTransactionsByAddressEVMRI = (function () {
    function ListInternalTransactionsByAddressEVMRI() {
    }
    ListInternalTransactionsByAddressEVMRI.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVMRI.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVMRI.discriminator = undefined;
    ListInternalTransactionsByAddressEVMRI.attributeTypeMap = [
        {
            "name": "transactionHash",
            "baseName": "transactionHash",
            "type": "string"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListInternalTransactionsByAddressEVMRIMinedInBlock"
        },
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
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListInternalTransactionsByAddressEVMRIValue"
        }
    ];
    return ListInternalTransactionsByAddressEVMRI;
}());
exports.ListInternalTransactionsByAddressEVMRI = ListInternalTransactionsByAddressEVMRI;
//# sourceMappingURL=listInternalTransactionsByAddressEVMRI.js.map