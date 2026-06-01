"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddressR = void 0;
var ConvertBitcoinCashAddressR = (function () {
    function ConvertBitcoinCashAddressR() {
    }
    ConvertBitcoinCashAddressR.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddressR.attributeTypeMap;
    };
    ConvertBitcoinCashAddressR.discriminator = undefined;
    ConvertBitcoinCashAddressR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ConvertBitcoinCashAddressRData"
        }
    ];
    return ConvertBitcoinCashAddressR;
}());
exports.ConvertBitcoinCashAddressR = ConvertBitcoinCashAddressR;
//# sourceMappingURL=convertBitcoinCashAddressR.js.map