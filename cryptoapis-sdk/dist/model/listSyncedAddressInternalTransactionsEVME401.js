"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVME401 = void 0;
var ListSyncedAddressInternalTransactionsEVME401 = (function () {
    function ListSyncedAddressInternalTransactionsEVME401() {
    }
    ListSyncedAddressInternalTransactionsEVME401.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVME401.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVME401.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVME401.attributeTypeMap = [
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
    return ListSyncedAddressInternalTransactionsEVME401;
}());
exports.ListSyncedAddressInternalTransactionsEVME401 = ListSyncedAddressInternalTransactionsEVME401;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVME401.js.map