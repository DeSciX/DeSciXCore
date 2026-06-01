"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddressE401 = void 0;
var ConvertBitcoinCashAddressE401 = (function () {
    function ConvertBitcoinCashAddressE401() {
    }
    ConvertBitcoinCashAddressE401.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddressE401.attributeTypeMap;
    };
    ConvertBitcoinCashAddressE401.discriminator = undefined;
    ConvertBitcoinCashAddressE401.attributeTypeMap = [
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
    return ConvertBitcoinCashAddressE401;
}());
exports.ConvertBitcoinCashAddressE401 = ConvertBitcoinCashAddressE401;
//# sourceMappingURL=convertBitcoinCashAddressE401.js.map