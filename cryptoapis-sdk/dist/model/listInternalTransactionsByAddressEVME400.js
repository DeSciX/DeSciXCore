"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVME400 = void 0;
var ListInternalTransactionsByAddressEVME400 = (function () {
    function ListInternalTransactionsByAddressEVME400() {
    }
    ListInternalTransactionsByAddressEVME400.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVME400.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVME400.discriminator = undefined;
    ListInternalTransactionsByAddressEVME400.attributeTypeMap = [
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
    return ListInternalTransactionsByAddressEVME400;
}());
exports.ListInternalTransactionsByAddressEVME400 = ListInternalTransactionsByAddressEVME400;
//# sourceMappingURL=listInternalTransactionsByAddressEVME400.js.map