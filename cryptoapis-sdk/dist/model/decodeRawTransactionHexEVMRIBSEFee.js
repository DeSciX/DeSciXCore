"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRIBSEFee = void 0;
var DecodeRawTransactionHexEVMRIBSEFee = (function () {
    function DecodeRawTransactionHexEVMRIBSEFee() {
    }
    DecodeRawTransactionHexEVMRIBSEFee.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRIBSEFee.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRIBSEFee.discriminator = undefined;
    DecodeRawTransactionHexEVMRIBSEFee.attributeTypeMap = [
        {
            "name": "maxFeePerGas",
            "baseName": "maxFeePerGas",
            "type": "string"
        },
        {
            "name": "maxPrioriryFeePerGas",
            "baseName": "maxPrioriryFeePerGas",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return DecodeRawTransactionHexEVMRIBSEFee;
}());
exports.DecodeRawTransactionHexEVMRIBSEFee = DecodeRawTransactionHexEVMRIBSEFee;
//# sourceMappingURL=decodeRawTransactionHexEVMRIBSEFee.js.map