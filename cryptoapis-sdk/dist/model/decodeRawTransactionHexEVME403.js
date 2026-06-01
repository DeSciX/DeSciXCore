"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeRawTransactionHexEVME403 = void 0;
var DecodeRawTransactionHexEVME403 = (function () {
    function DecodeRawTransactionHexEVME403() {
    }
    DecodeRawTransactionHexEVME403.getAttributeTypeMap = function () {
        return DecodeRawTransactionHexEVME403.attributeTypeMap;
    };
    DecodeRawTransactionHexEVME403.discriminator = undefined;
    DecodeRawTransactionHexEVME403.attributeTypeMap = [
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
    return DecodeRawTransactionHexEVME403;
}());
exports.DecodeRawTransactionHexEVME403 = DecodeRawTransactionHexEVME403;
//# sourceMappingURL=decodeRawTransactionHexEVME403.js.map