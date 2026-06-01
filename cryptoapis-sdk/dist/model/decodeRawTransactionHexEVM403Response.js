"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVM403Response = void 0;
var DecodeRawTransactionHexEVM403Response = (function () {
    function DecodeRawTransactionHexEVM403Response() {
    }
    DecodeRawTransactionHexEVM403Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVM403Response.attributeTypeMap;
    };
    DecodeRawTransactionHexEVM403Response.discriminator = undefined;
    DecodeRawTransactionHexEVM403Response.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexEVME403"
        }
    ];
    return DecodeRawTransactionHexEVM403Response;
}());
exports.DecodeRawTransactionHexEVM403Response = DecodeRawTransactionHexEVM403Response;
//# sourceMappingURL=decodeRawTransactionHexEVM403Response.js.map