"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXORI = void 0;
var DecodeRawTransactionHexUTXORI = (function () {
    function DecodeRawTransactionHexUTXORI() {
    }
    DecodeRawTransactionHexUTXORI.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXORI.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXORI.discriminator = undefined;
    DecodeRawTransactionHexUTXORI.attributeTypeMap = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "size",
            "baseName": "size",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "inputs",
            "baseName": "inputs",
            "type": "Array<DecodeRawTransactionHexUTXORIInputsInner>"
        },
        {
            "name": "locktime",
            "baseName": "locktime",
            "type": "number"
        },
        {
            "name": "outputs",
            "baseName": "outputs",
            "type": "Array<DecodeRawTransactionHexUTXORIOutputsInner>"
        },
        {
            "name": "version",
            "baseName": "version",
            "type": "number"
        },
        {
            "name": "vsize",
            "baseName": "vsize",
            "type": "number"
        },
        {
            "name": "weight",
            "baseName": "weight",
            "type": "number"
        }
    ];
    return DecodeRawTransactionHexUTXORI;
}());
exports.DecodeRawTransactionHexUTXORI = DecodeRawTransactionHexUTXORI;
//# sourceMappingURL=decodeRawTransactionHexUTXORI.js.map