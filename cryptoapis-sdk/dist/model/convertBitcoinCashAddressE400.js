"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddressE400 = void 0;
var ConvertBitcoinCashAddressE400 = (function () {
    function ConvertBitcoinCashAddressE400() {
    }
    ConvertBitcoinCashAddressE400.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddressE400.attributeTypeMap;
    };
    ConvertBitcoinCashAddressE400.discriminator = undefined;
    ConvertBitcoinCashAddressE400.attributeTypeMap = [
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
    return ConvertBitcoinCashAddressE400;
}());
exports.ConvertBitcoinCashAddressE400 = ConvertBitcoinCashAddressE400;
//# sourceMappingURL=convertBitcoinCashAddressE400.js.map