"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRIValue = void 0;
var PrepareTransactionFromAddressEVMRIValue = (function () {
    function PrepareTransactionFromAddressEVMRIValue() {
    }
    PrepareTransactionFromAddressEVMRIValue.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRIValue.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRIValue.discriminator = undefined;
    PrepareTransactionFromAddressEVMRIValue.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return PrepareTransactionFromAddressEVMRIValue;
}());
exports.PrepareTransactionFromAddressEVMRIValue = PrepareTransactionFromAddressEVMRIValue;
//# sourceMappingURL=prepareTransactionFromAddressEVMRIValue.js.map