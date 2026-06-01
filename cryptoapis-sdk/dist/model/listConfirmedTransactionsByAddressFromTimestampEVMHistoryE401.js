"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401 = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401 = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401 = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryE401.js.map