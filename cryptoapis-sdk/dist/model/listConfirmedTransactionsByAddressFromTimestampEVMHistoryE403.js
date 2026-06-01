"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403 = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403 = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403 = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryE403.js.map