"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressInternalTransactionConfirmedDataItemMinedInBlock = void 0;
var AddressInternalTransactionConfirmedDataItemMinedInBlock = (function () {
    function AddressInternalTransactionConfirmedDataItemMinedInBlock() {
    }
    AddressInternalTransactionConfirmedDataItemMinedInBlock.getAttributeTypeMap = function () {
        return AddressInternalTransactionConfirmedDataItemMinedInBlock.attributeTypeMap;
    };
    AddressInternalTransactionConfirmedDataItemMinedInBlock.discriminator = undefined;
    AddressInternalTransactionConfirmedDataItemMinedInBlock.attributeTypeMap = [
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
    return AddressInternalTransactionConfirmedDataItemMinedInBlock;
}());
exports.AddressInternalTransactionConfirmedDataItemMinedInBlock = AddressInternalTransactionConfirmedDataItemMinedInBlock;
//# sourceMappingURL=addressInternalTransactionConfirmedDataItemMinedInBlock.js.map