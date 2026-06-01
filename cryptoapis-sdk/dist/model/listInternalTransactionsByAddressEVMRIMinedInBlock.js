"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVMRIMinedInBlock = void 0;
var ListInternalTransactionsByAddressEVMRIMinedInBlock = (function () {
    function ListInternalTransactionsByAddressEVMRIMinedInBlock() {
    }
    ListInternalTransactionsByAddressEVMRIMinedInBlock.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVMRIMinedInBlock.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVMRIMinedInBlock.discriminator = undefined;
    ListInternalTransactionsByAddressEVMRIMinedInBlock.attributeTypeMap = [
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
    return ListInternalTransactionsByAddressEVMRIMinedInBlock;
}());
exports.ListInternalTransactionsByAddressEVMRIMinedInBlock = ListInternalTransactionsByAddressEVMRIMinedInBlock;
//# sourceMappingURL=listInternalTransactionsByAddressEVMRIMinedInBlock.js.map