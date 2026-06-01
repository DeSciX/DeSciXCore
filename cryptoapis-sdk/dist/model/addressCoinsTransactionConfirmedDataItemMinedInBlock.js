"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressCoinsTransactionConfirmedDataItemMinedInBlock = void 0;
var AddressCoinsTransactionConfirmedDataItemMinedInBlock = (function () {
    function AddressCoinsTransactionConfirmedDataItemMinedInBlock() {
    }
    AddressCoinsTransactionConfirmedDataItemMinedInBlock.getAttributeTypeMap = function () {
        return AddressCoinsTransactionConfirmedDataItemMinedInBlock.attributeTypeMap;
    };
    AddressCoinsTransactionConfirmedDataItemMinedInBlock.discriminator = undefined;
    AddressCoinsTransactionConfirmedDataItemMinedInBlock.attributeTypeMap = [
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
    return AddressCoinsTransactionConfirmedDataItemMinedInBlock;
}());
exports.AddressCoinsTransactionConfirmedDataItemMinedInBlock = AddressCoinsTransactionConfirmedDataItemMinedInBlock;
//# sourceMappingURL=addressCoinsTransactionConfirmedDataItemMinedInBlock.js.map