"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVME400 = void 0;
var PrepareTransactionFromAddressEVME400 = (function () {
    function PrepareTransactionFromAddressEVME400() {
    }
    PrepareTransactionFromAddressEVME400.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVME400.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVME400.discriminator = undefined;
    PrepareTransactionFromAddressEVME400.attributeTypeMap = [
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
    return PrepareTransactionFromAddressEVME400;
}());
exports.PrepareTransactionFromAddressEVME400 = PrepareTransactionFromAddressEVME400;
//# sourceMappingURL=prepareTransactionFromAddressEVME400.js.map