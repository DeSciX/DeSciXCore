"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXORB = void 0;
var DecodeRawTransactionHexUTXORB = (function () {
    function DecodeRawTransactionHexUTXORB() {
    }
    DecodeRawTransactionHexUTXORB.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXORB.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXORB.discriminator = undefined;
    DecodeRawTransactionHexUTXORB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "DecodeRawTransactionHexUTXORBData"
        }
    ];
    return DecodeRawTransactionHexUTXORB;
}());
exports.DecodeRawTransactionHexUTXORB = DecodeRawTransactionHexUTXORB;
//# sourceMappingURL=decodeRawTransactionHexUTXORB.js.map