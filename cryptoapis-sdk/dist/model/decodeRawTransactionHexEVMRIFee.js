"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRIFee = void 0;
var DecodeRawTransactionHexEVMRIFee = (function () {
    function DecodeRawTransactionHexEVMRIFee() {
    }
    DecodeRawTransactionHexEVMRIFee.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRIFee.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRIFee.discriminator = undefined;
    DecodeRawTransactionHexEVMRIFee.attributeTypeMap = [
        {
            "name": "approximateAmount",
            "baseName": "approximateAmount",
            "type": "string"
        },
        {
            "name": "approximateMinimumRequiredAmount",
            "baseName": "approximateMinimumRequiredAmount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        },
        {
            "name": "aproximateAmount",
            "baseName": "aproximateAmount",
            "type": "string"
        }
    ];
    return DecodeRawTransactionHexEVMRIFee;
}());
exports.DecodeRawTransactionHexEVMRIFee = DecodeRawTransactionHexEVMRIFee;
//# sourceMappingURL=decodeRawTransactionHexEVMRIFee.js.map