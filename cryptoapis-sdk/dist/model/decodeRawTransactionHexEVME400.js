"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVME400 = void 0;
var DecodeRawTransactionHexEVME400 = (function () {
    function DecodeRawTransactionHexEVME400() {
    }
    DecodeRawTransactionHexEVME400.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVME400.attributeTypeMap;
    };
    DecodeRawTransactionHexEVME400.discriminator = undefined;
    DecodeRawTransactionHexEVME400.attributeTypeMap = [
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
    return DecodeRawTransactionHexEVME400;
}());
exports.DecodeRawTransactionHexEVME400 = DecodeRawTransactionHexEVME400;
//# sourceMappingURL=decodeRawTransactionHexEVME400.js.map