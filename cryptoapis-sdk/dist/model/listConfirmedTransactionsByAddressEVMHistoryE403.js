"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryE403 = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryE403 = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryE403() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryE403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryE403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryE403.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryE403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVMHistoryE403;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryE403 = ListConfirmedTransactionsByAddressEVMHistoryE403;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryE403.js.map