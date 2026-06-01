"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVME401 = void 0;
var PrepareTransactionFromAddressEVME401 = (function () {
    function PrepareTransactionFromAddressEVME401() {
    }
    PrepareTransactionFromAddressEVME401.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVME401.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVME401.discriminator = undefined;
    PrepareTransactionFromAddressEVME401.attributeTypeMap = [
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
    return PrepareTransactionFromAddressEVME401;
}());
exports.PrepareTransactionFromAddressEVME401 = PrepareTransactionFromAddressEVME401;
//# sourceMappingURL=prepareTransactionFromAddressEVME401.js.map