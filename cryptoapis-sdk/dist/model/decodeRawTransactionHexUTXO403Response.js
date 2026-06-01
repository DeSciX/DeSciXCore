"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXO403Response = void 0;
var DecodeRawTransactionHexUTXO403Response = (function () {
    function DecodeRawTransactionHexUTXO403Response() {
    }
    DecodeRawTransactionHexUTXO403Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXO403Response.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXO403Response.discriminator = undefined;
    DecodeRawTransactionHexUTXO403Response.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexUTXOE403"
        }
    ];
    return DecodeRawTransactionHexUTXO403Response;
}());
exports.DecodeRawTransactionHexUTXO403Response = DecodeRawTransactionHexUTXO403Response;
//# sourceMappingURL=decodeRawTransactionHexUTXO403Response.js.map