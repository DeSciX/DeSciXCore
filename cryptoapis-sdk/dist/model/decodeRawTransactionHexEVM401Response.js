"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVM401Response = void 0;
var DecodeRawTransactionHexEVM401Response = (function () {
    function DecodeRawTransactionHexEVM401Response() {
    }
    DecodeRawTransactionHexEVM401Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVM401Response.attributeTypeMap;
    };
    DecodeRawTransactionHexEVM401Response.discriminator = undefined;
    DecodeRawTransactionHexEVM401Response.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexEVME401"
        }
    ];
    return DecodeRawTransactionHexEVM401Response;
}());
exports.DecodeRawTransactionHexEVM401Response = DecodeRawTransactionHexEVM401Response;
//# sourceMappingURL=decodeRawTransactionHexEVM401Response.js.map