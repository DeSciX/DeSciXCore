"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryE401 = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryE401 = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryE401() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryE401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryE401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryE401.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryE401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVMHistoryE401;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryE401 = ListConfirmedTransactionsByAddressEVMHistoryE401;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryE401.js.map