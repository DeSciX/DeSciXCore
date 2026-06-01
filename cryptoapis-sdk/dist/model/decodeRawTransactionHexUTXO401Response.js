"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXO401Response = void 0;
var DecodeRawTransactionHexUTXO401Response = (function () {
    function DecodeRawTransactionHexUTXO401Response() {
    }
    DecodeRawTransactionHexUTXO401Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXO401Response.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXO401Response.discriminator = undefined;
    DecodeRawTransactionHexUTXO401Response.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexUTXOE401"
        }
    ];
    return DecodeRawTransactionHexUTXO401Response;
}());
exports.DecodeRawTransactionHexUTXO401Response = DecodeRawTransactionHexUTXO401Response;
//# sourceMappingURL=decodeRawTransactionHexUTXO401Response.js.map