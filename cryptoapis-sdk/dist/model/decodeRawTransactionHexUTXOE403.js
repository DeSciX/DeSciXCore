"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexUTXOE403 = void 0;
var DecodeRawTransactionHexUTXOE403 = (function () {
    function DecodeRawTransactionHexUTXOE403() {
    }
    DecodeRawTransactionHexUTXOE403.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexUTXOE403.attributeTypeMap;
    };
    DecodeRawTransactionHexUTXOE403.discriminator = undefined;
    DecodeRawTransactionHexUTXOE403.attributeTypeMap = [
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
    return DecodeRawTransactionHexUTXOE403;
}());
exports.DecodeRawTransactionHexUTXOE403 = DecodeRawTransactionHexUTXOE403;
//# sourceMappingURL=decodeRawTransactionHexUTXOE403.js.map