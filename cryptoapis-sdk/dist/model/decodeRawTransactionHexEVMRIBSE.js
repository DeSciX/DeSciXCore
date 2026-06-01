"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRIBSE = void 0;
var DecodeRawTransactionHexEVMRIBSE = (function () {
    function DecodeRawTransactionHexEVMRIBSE() {
    }
    DecodeRawTransactionHexEVMRIBSE.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRIBSE.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRIBSE.discriminator = undefined;
    DecodeRawTransactionHexEVMRIBSE.attributeTypeMap = [
        {
            "name": "fee",
            "baseName": "fee",
            "type": "DecodeRawTransactionHexEVMRIBSEFee"
        }
    ];
    return DecodeRawTransactionHexEVMRIBSE;
}());
exports.DecodeRawTransactionHexEVMRIBSE = DecodeRawTransactionHexEVMRIBSE;
//# sourceMappingURL=decodeRawTransactionHexEVMRIBSE.js.map