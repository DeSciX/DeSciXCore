"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddressE403 = void 0;
var ConvertBitcoinCashAddressE403 = (function () {
    function ConvertBitcoinCashAddressE403() {
    }
    ConvertBitcoinCashAddressE403.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddressE403.attributeTypeMap;
    };
    ConvertBitcoinCashAddressE403.discriminator = undefined;
    ConvertBitcoinCashAddressE403.attributeTypeMap = [
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
    return ConvertBitcoinCashAddressE403;
}());
exports.ConvertBitcoinCashAddressE403 = ConvertBitcoinCashAddressE403;
//# sourceMappingURL=convertBitcoinCashAddressE403.js.map