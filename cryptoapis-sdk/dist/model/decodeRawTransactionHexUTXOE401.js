"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXOE401 = void 0;
var DecodeRawTransactionHexUTXOE401 = (function () {
    function DecodeRawTransactionHexUTXOE401() {
    }
    DecodeRawTransactionHexUTXOE401.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXOE401.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXOE401.discriminator = undefined;
    DecodeRawTransactionHexUTXOE401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return DecodeRawTransactionHexUTXOE401;
}());
exports.DecodeRawTransactionHexUTXOE401 = DecodeRawTransactionHexUTXOE401;
//# sourceMappingURL=decodeRawTransactionHexUTXOE401.js.map