"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddressRB = void 0;
var ConvertBitcoinCashAddressRB = (function () {
    function ConvertBitcoinCashAddressRB() {
    }
    ConvertBitcoinCashAddressRB.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddressRB.attributeTypeMap;
    };
    ConvertBitcoinCashAddressRB.discriminator = undefined;
    ConvertBitcoinCashAddressRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ConvertBitcoinCashAddressRBData"
        }
    ];
    return ConvertBitcoinCashAddressRB;
}());
exports.ConvertBitcoinCashAddressRB = ConvertBitcoinCashAddressRB;
//# sourceMappingURL=convertBitcoinCashAddressRB.js.map