"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRB = void 0;
var DecodeRawTransactionHexEVMRB = (function () {
    function DecodeRawTransactionHexEVMRB() {
    }
    DecodeRawTransactionHexEVMRB.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRB.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRB.discriminator = undefined;
    DecodeRawTransactionHexEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "DecodeRawTransactionHexEVMRBData"
        }
    ];
    return DecodeRawTransactionHexEVMRB;
}());
exports.DecodeRawTransactionHexEVMRB = DecodeRawTransactionHexEVMRB;
//# sourceMappingURL=decodeRawTransactionHexEVMRB.js.map