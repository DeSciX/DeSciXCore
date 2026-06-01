"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXORIOutputsInner = void 0;
var DecodeRawTransactionHexUTXORIOutputsInner = (function () {
    function DecodeRawTransactionHexUTXORIOutputsInner() {
    }
    DecodeRawTransactionHexUTXORIOutputsInner.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXORIOutputsInner.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXORIOutputsInner.discriminator = undefined;
    DecodeRawTransactionHexUTXORIOutputsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "script",
            "baseName": "script",
            "type": "DecodeRawTransactionHexUTXORIOutputsInnerScript"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "DecodeRawTransactionHexUTXORIOutputsInnerValue"
        }
    ];
    return DecodeRawTransactionHexUTXORIOutputsInner;
}());
exports.DecodeRawTransactionHexUTXORIOutputsInner = DecodeRawTransactionHexUTXORIOutputsInner;
//# sourceMappingURL=decodeRawTransactionHexUTXORIOutputsInner.js.map