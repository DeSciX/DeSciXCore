"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertBitcoinCashAddress400Response = void 0;
var ConvertBitcoinCashAddress400Response = (function () {
    function ConvertBitcoinCashAddress400Response() {
    }
    ConvertBitcoinCashAddress400Response.getAttributeTypeMap = function () {
        return ConvertBitcoinCashAddress400Response.attributeTypeMap;
    };
    ConvertBitcoinCashAddress400Response.discriminator = undefined;
    ConvertBitcoinCashAddress400Response.attributeTypeMap = [
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
            "type": "ConvertBitcoinCashAddressE400"
        }
    ];
    return ConvertBitcoinCashAddress400Response;
}());
exports.ConvertBitcoinCashAddress400Response = ConvertBitcoinCashAddress400Response;
//# sourceMappingURL=convertBitcoinCashAddress400Response.js.map