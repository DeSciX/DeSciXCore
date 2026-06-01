"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddress403Response = void 0;
var ConvertBitcoinCashAddress403Response = (function () {
    function ConvertBitcoinCashAddress403Response() {
    }
    ConvertBitcoinCashAddress403Response.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddress403Response.attributeTypeMap;
    };
    ConvertBitcoinCashAddress403Response.discriminator = undefined;
    ConvertBitcoinCashAddress403Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ConvertBitcoinCashAddressE403"
        }
    ];
    return ConvertBitcoinCashAddress403Response;
}());
exports.ConvertBitcoinCashAddress403Response = ConvertBitcoinCashAddress403Response;
//# sourceMappingURL=convertBitcoinCashAddress403Response.js.map