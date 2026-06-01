"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVMRData = void 0;
var ListSyncedAddressTokensTransferEVMRData = (function () {
    function ListSyncedAddressTokensTransferEVMRData() {
    }
    ListSyncedAddressTokensTransferEVMRData.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVMRData.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVMRData.discriminator = undefined;
    ListSyncedAddressTokensTransferEVMRData.attributeTypeMap = [
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
            "type": "Array<ListSyncedAddressTokensTransferEVMRI>"
        }
    ];
    return ListSyncedAddressTokensTransferEVMRData;
}());
exports.ListSyncedAddressTokensTransferEVMRData = ListSyncedAddressTokensTransferEVMRData;
//# sourceMappingURL=listSyncedAddressTokensTransferEVMRData.js.map