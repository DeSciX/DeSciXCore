"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXO400Response = void 0;
var DecodeRawTransactionHexUTXO400Response = (function () {
    function DecodeRawTransactionHexUTXO400Response() {
    }
    DecodeRawTransactionHexUTXO400Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXO400Response.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXO400Response.discriminator = undefined;
    DecodeRawTransactionHexUTXO400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "DecodeRawTransactionHexUTXOE400"
        }
    ];
    return DecodeRawTransactionHexUTXO400Response;
}());
exports.DecodeRawTransactionHexUTXO400Response = DecodeRawTransactionHexUTXO400Response;
//# sourceMappingURL=decodeRawTransactionHexUTXO400Response.js.map