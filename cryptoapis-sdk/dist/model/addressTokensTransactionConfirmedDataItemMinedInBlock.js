"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressTokensTransactionConfirmedDataItemMinedInBlock = void 0;
var AddressTokensTransactionConfirmedDataItemMinedInBlock = (function () {
    function AddressTokensTransactionConfirmedDataItemMinedInBlock() {
    }
    AddressTokensTransactionConfirmedDataItemMinedInBlock.getAttributeTypeMap = function () {
        return AddressTokensTransactionConfirmedDataItemMinedInBlock.attributeTypeMap;
    };
    AddressTokensTransactionConfirmedDataItemMinedInBlock.discriminator = undefined;
    AddressTokensTransactionConfirmedDataItemMinedInBlock.attributeTypeMap = [
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        },
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        }
    ];
    return AddressTokensTransactionConfirmedDataItemMinedInBlock;
}());
exports.AddressTokensTransactionConfirmedDataItemMinedInBlock = AddressTokensTransactionConfirmedDataItemMinedInBlock;
//# sourceMappingURL=addressTokensTransactionConfirmedDataItemMinedInBlock.js.map