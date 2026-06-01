"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedTrc721 = void 0;
var AddressTokensTransactionConfirmedTrc721 = (function () {
    function AddressTokensTransactionConfirmedTrc721() {
    }
    AddressTokensTransactionConfirmedTrc721.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedTrc721.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedTrc721.discriminator = undefined;
    AddressTokensTransactionConfirmedTrc721.attributeTypeMap = [
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
            "name": "tokenId",
            "baseName": "tokenId",
            "type": "string"
        },
        {
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        }
    ];
    return AddressTokensTransactionConfirmedTrc721;
}());
exports.AddressTokensTransactionConfirmedTrc721 = AddressTokensTransactionConfirmedTrc721;
//# sourceMappingURL=addressTokensTransactionConfirmedTrc721.js.map