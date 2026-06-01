"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareTransactionFromAddressEVMRIFee = void 0;
var PrepareTransactionFromAddressEVMRIFee = (function () {
    function PrepareTransactionFromAddressEVMRIFee() {
    }
    PrepareTransactionFromAddressEVMRIFee.getAttributeTypeMap = function () {
        return PrepareTransactionFromAddressEVMRIFee.attributeTypeMap;
    };
    PrepareTransactionFromAddressEVMRIFee.discriminator = undefined;
    PrepareTransactionFromAddressEVMRIFee.attributeTypeMap = [
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "number"
        },
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "number"
        },
        {
            "name": "maxPriorityFeePerGas",
            "baseName": "maxPriorityFeePerGas",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return PrepareTransactionFromAddressEVMRIFee;
}());
exports.PrepareTransactionFromAddressEVMRIFee = PrepareTransactionFromAddressEVMRIFee;
//# sourceMappingURL=prepareTransactionFromAddressEVMRIFee.js.map