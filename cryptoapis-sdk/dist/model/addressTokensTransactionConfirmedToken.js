"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedToken = void 0;
var AddressTokensTransactionConfirmedToken = (function () {
    function AddressTokensTransactionConfirmedToken() {
    }
    AddressTokensTransactionConfirmedToken.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedToken.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedToken.discriminator = undefined;
    AddressTokensTransactionConfirmedToken.attributeTypeMap = [
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
        },
        {
            "name": "tokenId",
            "baseName": "tokenId",
            "type": "string"
        },
        {
            "name": "propertyId",
            "baseName": "propertyId",
            "type": "string"
        },
        {
            "name": "transactionType",
            "baseName": "transactionType",
            "type": "string"
        },
        {
            "name": "createdByTransactionId",
            "baseName": "createdByTransactionId",
            "type": "string"
        }
    ];
    return AddressTokensTransactionConfirmedToken;
}());
exports.AddressTokensTransactionConfirmedToken = AddressTokensTransactionConfirmedToken;
//# sourceMappingURL=addressTokensTransactionConfirmedToken.js.map