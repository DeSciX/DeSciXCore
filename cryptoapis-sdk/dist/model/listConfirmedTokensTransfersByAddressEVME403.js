"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVME403 = void 0;
var ListConfirmedTokensTransfersByAddressEVME403 = (function () {
    function ListConfirmedTokensTransfersByAddressEVME403() {
    }
    ListConfirmedTokensTransfersByAddressEVME403.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVME403.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVME403.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVME403.attributeTypeMap = [
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
    return ListConfirmedTokensTransfersByAddressEVME403;
}());
exports.ListConfirmedTokensTransfersByAddressEVME403 = ListConfirmedTokensTransfersByAddressEVME403;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVME403.js.map