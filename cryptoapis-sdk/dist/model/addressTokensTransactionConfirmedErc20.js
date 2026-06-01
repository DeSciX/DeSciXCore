"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedErc20 = void 0;
var AddressTokensTransactionConfirmedErc20 = (function () {
    function AddressTokensTransactionConfirmedErc20() {
    }
    AddressTokensTransactionConfirmedErc20.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedErc20.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedErc20.discriminator = undefined;
    AddressTokensTransactionConfirmedErc20.attributeTypeMap = [
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
    return AddressTokensTransactionConfirmedErc20;
}());
exports.AddressTokensTransactionConfirmedErc20 = AddressTokensTransactionConfirmedErc20;
//# sourceMappingURL=addressTokensTransactionConfirmedErc20.js.map