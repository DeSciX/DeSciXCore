"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressTokensTransferEVME401 = void 0;
var ListSyncedAddressTokensTransferEVME401 = (function () {
    function ListSyncedAddressTokensTransferEVME401() {
    }
    ListSyncedAddressTokensTransferEVME401.getAttributeTypeMap = function () {
        return ListSyncedAddressTokensTransferEVME401.attributeTypeMap;
    };
    ListSyncedAddressTokensTransferEVME401.discriminator = undefined;
    ListSyncedAddressTokensTransferEVME401.attributeTypeMap = [
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
    return ListSyncedAddressTokensTransferEVME401;
}());
exports.ListSyncedAddressTokensTransferEVME401 = ListSyncedAddressTokensTransferEVME401;
//# sourceMappingURL=listSyncedAddressTokensTransferEVME401.js.map