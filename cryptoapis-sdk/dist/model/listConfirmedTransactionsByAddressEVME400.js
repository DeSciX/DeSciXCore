"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVME400 = void 0;
var ListConfirmedTransactionsByAddressEVME400 = (function () {
    function ListConfirmedTransactionsByAddressEVME400() {
    }
    ListConfirmedTransactionsByAddressEVME400.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVME400.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVME400.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVME400.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVME400;
}());
exports.ListConfirmedTransactionsByAddressEVME400 = ListConfirmedTransactionsByAddressEVME400;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVME400.js.map