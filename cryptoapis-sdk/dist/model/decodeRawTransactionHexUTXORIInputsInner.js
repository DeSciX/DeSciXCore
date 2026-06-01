"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXORIInputsInner = void 0;
var DecodeRawTransactionHexUTXORIInputsInner = (function () {
    function DecodeRawTransactionHexUTXORIInputsInner() {
    }
    DecodeRawTransactionHexUTXORIInputsInner.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXORIInputsInner.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXORIInputsInner.discriminator = undefined;
    DecodeRawTransactionHexUTXORIInputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "outputIndex",
            "baseName": "outputIndex",
            "type": "number"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "DecodeRawTransactionHexUTXORIInputsInnerScript"
        },
        {
            "name": "sequence",
            "baseName": "sequence",
            "type": "number"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "witnesses",
            "baseName": "witnesses",
            "type": "Array<string>"
        }
    ];
    return DecodeRawTransactionHexUTXORIInputsInner;
}());
exports.DecodeRawTransactionHexUTXORIInputsInner = DecodeRawTransactionHexUTXORIInputsInner;
//# sourceMappingURL=decodeRawTransactionHexUTXORIInputsInner.js.map