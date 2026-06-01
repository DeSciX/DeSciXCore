"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistoryR = void 0;
var ListConfirmedTransactionsByAddressEVMHistoryR = (function () {
    function ListConfirmedTransactionsByAddressEVMHistoryR() {
    }
    ListConfirmedTransactionsByAddressEVMHistoryR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistoryR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistoryR.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistoryR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListConfirmedTransactionsByAddressEVMHistoryRData"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistoryR;
}());
exports.ListConfirmedTransactionsByAddressEVMHistoryR = ListConfirmedTransactionsByAddressEVMHistoryR;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistoryR.js.map