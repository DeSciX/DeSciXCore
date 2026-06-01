"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock = void 0;
var ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock() {
    }
    ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock.attributeTypeMap = [
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock = ListConfirmedTransactionsByAddressUTXOsRIMinedInBlock;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRIMinedInBlock.js.map