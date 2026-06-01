"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVME403 = void 0;
var ListSyncedAddressInternalTransactionsEVME403 = (function () {
    function ListSyncedAddressInternalTransactionsEVME403() {
    }
    ListSyncedAddressInternalTransactionsEVME403.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVME403.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVME403.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVME403.attributeTypeMap = [
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
    return ListSyncedAddressInternalTransactionsEVME403;
}());
exports.ListSyncedAddressInternalTransactionsEVME403 = ListSyncedAddressInternalTransactionsEVME403;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVME403.js.map