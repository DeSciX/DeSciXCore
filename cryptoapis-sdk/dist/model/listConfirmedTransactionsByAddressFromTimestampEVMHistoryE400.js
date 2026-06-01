"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400 = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400 = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400 = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryE400.js.map