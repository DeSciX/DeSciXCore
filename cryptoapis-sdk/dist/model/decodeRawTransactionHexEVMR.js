"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMR = void 0;
var DecodeRawTransactionHexEVMR = (function () {
    function DecodeRawTransactionHexEVMR() {
    }
    DecodeRawTransactionHexEVMR.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMR.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMR.discriminator = undefined;
    DecodeRawTransactionHexEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "DecodeRawTransactionHexEVMRData"
        }
    ];
    return DecodeRawTransactionHexEVMR;
}());
exports.DecodeRawTransactionHexEVMR = DecodeRawTransactionHexEVMR;
//# sourceMappingURL=decodeRawTransactionHexEVMR.js.map