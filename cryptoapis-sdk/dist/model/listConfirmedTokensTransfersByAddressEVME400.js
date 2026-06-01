"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVME400 = void 0;
var ListConfirmedTokensTransfersByAddressEVME400 = (function () {
    function ListConfirmedTokensTransfersByAddressEVME400() {
    }
    ListConfirmedTokensTransfersByAddressEVME400.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVME400.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVME400.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVME400.attributeTypeMap = [
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
    return ListConfirmedTokensTransfersByAddressEVME400;
}());
exports.ListConfirmedTokensTransfersByAddressEVME400 = ListConfirmedTokensTransfersByAddressEVME400;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVME400.js.map