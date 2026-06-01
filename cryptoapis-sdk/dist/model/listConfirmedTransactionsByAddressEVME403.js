"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVME403 = void 0;
var ListConfirmedTransactionsByAddressEVME403 = (function () {
    function ListConfirmedTransactionsByAddressEVME403() {
    }
    ListConfirmedTransactionsByAddressEVME403.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVME403.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVME403.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVME403.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVME403;
}());
exports.ListConfirmedTransactionsByAddressEVME403 = ListConfirmedTransactionsByAddressEVME403;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVME403.js.map