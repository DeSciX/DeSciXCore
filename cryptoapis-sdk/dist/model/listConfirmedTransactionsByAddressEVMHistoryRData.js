"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryRData = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryRData = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryRData() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTransactionsByAddressEVMHistoryRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistoryRData;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryRData = ListConfirmedTransactionsByAddressEVMHistoryRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryRData.js.map