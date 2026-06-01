"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryRIBST = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryRIBST = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryRIBST() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryRIBST.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryRIBST.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryRIBST.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryRIBST.attributeTypeMap = [
        {
            "name": "bandwithUsed",
            "baseName": "bandwithUsed",
            "type": "number"
        },
        {
            "name": "energyUsed",
            "baseName": "energyUsed",
            "type": "string"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistoryRIBST;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryRIBST = ListConfirmedTransactionsByAddressEVMHistoryRIBST;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryRIBST.js.map