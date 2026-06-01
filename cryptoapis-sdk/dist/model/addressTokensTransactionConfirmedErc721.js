"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedErc721 = void 0;
var AddressTokensTransactionConfirmedErc721 = (function () {
    function AddressTokensTransactionConfirmedErc721() {
    }
    AddressTokensTransactionConfirmedErc721.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedErc721.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedErc721.discriminator = undefined;
    AddressTokensTransactionConfirmedErc721.attributeTypeMap = [
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
    return AddressTokensTransactionConfirmedErc721;
}());
exports.AddressTokensTransactionConfirmedErc721 = AddressTokensTransactionConfirmedErc721;
//# sourceMappingURL=addressTokensTransactionConfirmedErc721.js.map