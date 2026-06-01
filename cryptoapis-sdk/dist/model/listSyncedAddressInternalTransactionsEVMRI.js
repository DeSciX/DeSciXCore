"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVMRI = void 0;
var ListSyncedAddressInternalTransactionsEVMRI = (function () {
    function ListSyncedAddressInternalTransactionsEVMRI() {
    }
    ListSyncedAddressInternalTransactionsEVMRI.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVMRI.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVMRI.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVMRI.attributeTypeMap = [
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "transactionHash",
            "baseName": "transactionHash",
            "type": "string"
        },
        {
            "name": "minedInBlock",
            "baseName": "minedInBlock",
            "type": "ListSyncedAddressInternalTransactionsEVMRIMinedInBlock"
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
            "name": "value",
            "baseName": "value",
            "type": "ListSyncedAddressInternalTransactionsEVMRIValue"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVMRI;
}());
exports.ListSyncedAddressInternalTransactionsEVMRI = ListSyncedAddressInternalTransactionsEVMRI;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVMRI.js.map