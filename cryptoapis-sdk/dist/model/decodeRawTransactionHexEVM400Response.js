"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVM400Response = void 0;
var DecodeRawTransactionHexEVM400Response = (function () {
    function DecodeRawTransactionHexEVM400Response() {
    }
    DecodeRawTransactionHexEVM400Response.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVM400Response.attributeTypeMap;
    };
    DecodeRawTransactionHexEVM400Response.discriminator = undefined;
    DecodeRawTransactionHexEVM400Response.attributeTypeMap = [
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
            "type": "DecodeRawTransactionHexEVME400"
        }
    ];
    return DecodeRawTransactionHexEVM400Response;
}());
exports.DecodeRawTransactionHexEVM400Response = DecodeRawTransactionHexEVM400Response;
//# sourceMappingURL=decodeRawTransactionHexEVM400Response.js.map