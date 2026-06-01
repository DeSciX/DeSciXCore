"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVME401 = void 0;
var DecodeRawTransactionHexEVME401 = (function () {
    function DecodeRawTransactionHexEVME401() {
    }
    DecodeRawTransactionHexEVME401.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVME401.attributeTypeMap;
    };
    DecodeRawTransactionHexEVME401.discriminator = undefined;
    DecodeRawTransactionHexEVME401.attributeTypeMap = [
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
    return DecodeRawTransactionHexEVME401;
}());
exports.DecodeRawTransactionHexEVME401 = DecodeRawTransactionHexEVME401;
//# sourceMappingURL=decodeRawTransactionHexEVME401.js.map