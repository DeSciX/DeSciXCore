"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVME403 = void 0;
var ListInternalTransactionsByAddressEVME403 = (function () {
    function ListInternalTransactionsByAddressEVME403() {
    }
    ListInternalTransactionsByAddressEVME403.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVME403.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVME403.discriminator = undefined;
    ListInternalTransactionsByAddressEVME403.attributeTypeMap = [
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
    return ListInternalTransactionsByAddressEVME403;
}());
exports.ListInternalTransactionsByAddressEVME403 = ListInternalTransactionsByAddressEVME403;
//# sourceMappingURL=listInternalTransactionsByAddressEVME403.js.map