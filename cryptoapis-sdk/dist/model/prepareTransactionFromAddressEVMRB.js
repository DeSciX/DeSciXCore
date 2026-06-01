"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRB = void 0;
var PrepareTransactionFromAddressEVMRB = (function () {
    function PrepareTransactionFromAddressEVMRB() {
    }
    PrepareTransactionFromAddressEVMRB.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRB.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRB.discriminator = undefined;
    PrepareTransactionFromAddressEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "PrepareTransactionFromAddressEVMRBData"
        }
    ];
    return PrepareTransactionFromAddressEVMRB;
}());
exports.PrepareTransactionFromAddressEVMRB = PrepareTransactionFromAddressEVMRB;
//# sourceMappingURL=prepareTransactionFromAddressEVMRB.js.map