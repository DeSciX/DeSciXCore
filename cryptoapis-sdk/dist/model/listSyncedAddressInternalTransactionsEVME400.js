"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressInternalTransactionsEVME400 = void 0;
var ListSyncedAddressInternalTransactionsEVME400 = (function () {
    function ListSyncedAddressInternalTransactionsEVME400() {
    }
    ListSyncedAddressInternalTransactionsEVME400.getAttributeTypeMap = function () {
        return ListSyncedAddressInternalTransactionsEVME400.attributeTypeMap;
    };
    ListSyncedAddressInternalTransactionsEVME400.discriminator = undefined;
    ListSyncedAddressInternalTransactionsEVME400.attributeTypeMap = [
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
    return ListSyncedAddressInternalTransactionsEVME400;
}());
exports.ListSyncedAddressInternalTransactionsEVME400 = ListSyncedAddressInternalTransactionsEVME400;
//# sourceMappingURL=listSyncedAddressInternalTransactionsEVME400.js.map