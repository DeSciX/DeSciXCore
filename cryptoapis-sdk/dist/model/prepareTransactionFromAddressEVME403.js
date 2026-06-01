"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVME403 = void 0;
var PrepareTransactionFromAddressEVME403 = (function () {
    function PrepareTransactionFromAddressEVME403() {
    }
    PrepareTransactionFromAddressEVME403.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVME403.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVME403.discriminator = undefined;
    PrepareTransactionFromAddressEVME403.attributeTypeMap = [
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
    return PrepareTransactionFromAddressEVME403;
}());
exports.PrepareTransactionFromAddressEVME403 = PrepareTransactionFromAddressEVME403;
//# sourceMappingURL=prepareTransactionFromAddressEVME403.js.map