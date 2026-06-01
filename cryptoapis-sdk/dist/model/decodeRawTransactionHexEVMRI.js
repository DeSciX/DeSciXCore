"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVMRI = void 0;
var DecodeRawTransactionHexEVMRI = (function () {
    function DecodeRawTransactionHexEVMRI() {
    }
    DecodeRawTransactionHexEVMRI.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVMRI.attributeTypeMap;
    };
    DecodeRawTransactionHexEVMRI.discriminator = undefined;
    DecodeRawTransactionHexEVMRI.attributeTypeMap = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "gasLimit",
            "baseName": "gasLimit",
            "type": "number"
        },
        {
            "name": "gasPaidForData",
            "baseName": "gasPaidForData",
            "type": "number"
        },
        {
            "name": "inputData",
            "baseName": "inputData",
            "type": "string"
        },
        {
            "name": "nonce",
            "baseName": "nonce",
            "type": "number"
        },
        {
            "name": "r",
            "baseName": "r",
            "type": "string"
        },
        {
            "name": "recipient",
            "baseName": "recipient",
            "type": "string"
        },
        {
            "name": "s",
            "baseName": "s",
            "type": "string"
        },
        {
            "name": "sender",
            "baseName": "sender",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "number"
        },
        {
            "name": "v",
            "baseName": "v",
            "type": "string"
        },
        {
            "name": "fee",
            "baseName": "fee",
            "type": "DecodeRawTransactionHexEVMRIFee"
        },
        {
            "name": "gasPrice",
            "baseName": "gasPrice",
            "type": "DecodeRawTransactionHexEVMRIGasPrice"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "DecodeRawTransactionHexEVMRIValue"
        },
        {
            "name": "blockchainSpecific",
            "baseName": "blockchainSpecific",
            "type": "DecodeRawTransactionHexEVMRIBSE"
        }
    ];
    return DecodeRawTransactionHexEVMRI;
}());
exports.DecodeRawTransactionHexEVMRI = DecodeRawTransactionHexEVMRI;
//# sourceMappingURL=decodeRawTransactionHexEVMRI.js.map