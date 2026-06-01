"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVME401 = void 0;
var ListConfirmedTokensTransfersByAddressEVME401 = (function () {
    function ListConfirmedTokensTransfersByAddressEVME401() {
    }
    ListConfirmedTokensTransfersByAddressEVME401.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVME401.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVME401.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVME401.attributeTypeMap = [
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
    return ListConfirmedTokensTransfersByAddressEVME401;
}());
exports.ListConfirmedTokensTransfersByAddressEVME401 = ListConfirmedTokensTransfersByAddressEVME401;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVME401.js.map