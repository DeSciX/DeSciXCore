"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVMRData = void 0;
var ListSyncedAddressInternalTransactionsEVMRData = (function () {
    function ListSyncedAddressInternalTransactionsEVMRData() {
    }
    ListSyncedAddressInternalTransactionsEVMRData.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVMRData.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVMRData.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVMRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "startingAfter",
            "baseName": "startingAfter",
            "type": "string"
        },
        {
            "name": "hasMore",
            "baseName": "hasMore",
            "type": "boolean"
        },
        {
            "name": "nextStartingAfter",
            "baseName": "nextStartingAfter",
            "type": "string"
        },
        {
            "name": "sortingOrder",
            "baseName": "sortingOrder",
            "type": "string"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListSyncedAddressInternalTransactionsEVMRI>"
        }
    ];
    return ListSyncedAddressInternalTransactionsEVMRData;
}());
exports.ListSyncedAddressInternalTransactionsEVMRData = ListSyncedAddressInternalTransactionsEVMRData;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVMRData.js.map