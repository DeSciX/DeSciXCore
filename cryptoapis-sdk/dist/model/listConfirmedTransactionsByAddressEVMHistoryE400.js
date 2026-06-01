"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryE400 = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryE400 = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryE400() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryE400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryE400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryE400.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryE400.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVMHistoryE400;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryE400 = ListConfirmedTransactionsByAddressEVMHistoryE400;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryE400.js.map