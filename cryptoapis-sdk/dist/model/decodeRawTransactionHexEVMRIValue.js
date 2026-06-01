"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRIValue = void 0;
var DecodeRawTransactionHexEVMRIValue = (function () {
    function DecodeRawTransactionHexEVMRIValue() {
    }
    DecodeRawTransactionHexEVMRIValue.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRIValue.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRIValue.discriminator = undefined;
    DecodeRawTransactionHexEVMRIValue.attributeTypeMap = [
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
    return DecodeRawTransactionHexEVMRIValue;
}());
exports.DecodeRawTransactionHexEVMRIValue = DecodeRawTransactionHexEVMRIValue;
//# sourceMappingURL=decodeRawTransactionHexEVMRIValue.js.map