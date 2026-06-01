"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedBep20 = void 0;
var AddressTokensTransactionConfirmedBep20 = (function () {
    function AddressTokensTransactionConfirmedBep20() {
    }
    AddressTokensTransactionConfirmedBep20.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedBep20.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedBep20.discriminator = undefined;
    AddressTokensTransactionConfirmedBep20.attributeTypeMap = [
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
    return AddressTokensTransactionConfirmedBep20;
}());
exports.AddressTokensTransactionConfirmedBep20 = AddressTokensTransactionConfirmedBep20;
//# sourceMappingURL=addressTokensTransactionConfirmedBep20.js.map