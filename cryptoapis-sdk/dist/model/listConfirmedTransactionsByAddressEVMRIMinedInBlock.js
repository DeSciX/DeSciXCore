"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMRIMinedInBlock = void 0;
var ListConfirmedTransactionsByAddressEVMRIMinedInBlock = (function () {
    function ListConfirmedTransactionsByAddressEVMRIMinedInBlock() {
    }
    ListConfirmedTransactionsByAddressEVMRIMinedInBlock.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMRIMinedInBlock.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMRIMinedInBlock.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMRIMinedInBlock.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressEVMRIMinedInBlock;
}());
exports.ListConfirmedTransactionsByAddressEVMRIMinedInBlock = ListConfirmedTransactionsByAddressEVMRIMinedInBlock;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMRIMinedInBlock.js.map