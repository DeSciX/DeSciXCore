"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXOR = void 0;
var DecodeRawTransactionHexUTXOR = (function () {
    function DecodeRawTransactionHexUTXOR() {
    }
    DecodeRawTransactionHexUTXOR.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXOR.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXOR.discriminator = undefined;
    DecodeRawTransactionHexUTXOR.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexUTXORData"
        }
    ];
    return DecodeRawTransactionHexUTXOR;
}());
exports.DecodeRawTransactionHexUTXOR = DecodeRawTransactionHexUTXOR;
//# sourceMappingURL=decodeRawTransactionHexUTXOR.js.map