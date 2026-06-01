"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMRIBST = void 0;
var ListConfirmedTransactionsByAddressEVMRIBST = (function () {
    function ListConfirmedTransactionsByAddressEVMRIBST() {
    }
    ListConfirmedTransactionsByAddressEVMRIBST.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMRIBST.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMRIBST.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMRIBST.attributeTypeMap = [
        {
            "name": "bandwidthUsed",
            "baseName": "bandwidthUsed",
            "type": "number"
        },
        {
            "name": "energyUsed",
            "baseName": "energyUsed",
            "type": "string"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMRIBST;
}());
exports.ListConfirmedTransactionsByAddressEVMRIBST = ListConfirmedTransactionsByAddressEVMRIBST;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMRIBST.js.map