"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVME401 = void 0;
var ListInternalTransactionsByAddressEVME401 = (function () {
    function ListInternalTransactionsByAddressEVME401() {
    }
    ListInternalTransactionsByAddressEVME401.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVME401.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVME401.discriminator = undefined;
    ListInternalTransactionsByAddressEVME401.attributeTypeMap = [
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
    return ListInternalTransactionsByAddressEVME401;
}());
exports.ListInternalTransactionsByAddressEVME401 = ListInternalTransactionsByAddressEVME401;
//# sourceMappingURL=listInternalTransactionsByAddressEVME401.js.map