"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVME400 = void 0;
var ListSyncedAddressTokensTransferEVME400 = (function () {
    function ListSyncedAddressTokensTransferEVME400() {
    }
    ListSyncedAddressTokensTransferEVME400.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVME400.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVME400.discriminator = undefined;
    ListSyncedAddressTokensTransferEVME400.attributeTypeMap = [
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
    return ListSyncedAddressTokensTransferEVME400;
}());
exports.ListSyncedAddressTokensTransferEVME400 = ListSyncedAddressTokensTransferEVME400;
//# sourceMappingURL=listSyncedAddressTokensTransferEVME400.js.map