"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryRData.js.map