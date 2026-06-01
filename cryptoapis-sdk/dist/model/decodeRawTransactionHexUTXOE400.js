"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXOE400 = void 0;
var DecodeRawTransactionHexUTXOE400 = (function () {
    function DecodeRawTransactionHexUTXOE400() {
    }
    DecodeRawTransactionHexUTXOE400.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXOE400.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXOE400.discriminator = undefined;
    DecodeRawTransactionHexUTXOE400.attributeTypeMap = [
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
    return DecodeRawTransactionHexUTXOE400;
}());
exports.DecodeRawTransactionHexUTXOE400 = DecodeRawTransactionHexUTXOE400;
//# sourceMappingURL=decodeRawTransactionHexUTXOE400.js.map