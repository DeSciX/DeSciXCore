"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedTrc20 = void 0;
var AddressTokensTransactionConfirmedTrc20 = (function () {
    function AddressTokensTransactionConfirmedTrc20() {
    }
    AddressTokensTransactionConfirmedTrc20.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedTrc20.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedTrc20.discriminator = undefined;
    AddressTokensTransactionConfirmedTrc20.attributeTypeMap = [
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        },
        {
            "name": "decimals",
            "baseName": "decimals",
            "type": "string"
        },
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        }
    ];
    return AddressTokensTransactionConfirmedTrc20;
}());
exports.AddressTokensTransactionConfirmedTrc20 = AddressTokensTransactionConfirmedTrc20;
//# sourceMappingURL=addressTokensTransactionConfirmedTrc20.js.map