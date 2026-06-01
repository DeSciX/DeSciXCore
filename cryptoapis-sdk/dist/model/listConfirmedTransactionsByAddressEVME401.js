"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVME401 = void 0;
var ListConfirmedTransactionsByAddressEVME401 = (function () {
    function ListConfirmedTransactionsByAddressEVME401() {
    }
    ListConfirmedTransactionsByAddressEVME401.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVME401.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVME401.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVME401.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVME401;
}());
exports.ListConfirmedTransactionsByAddressEVME401 = ListConfirmedTransactionsByAddressEVME401;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVME401.js.map