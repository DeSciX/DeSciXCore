"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryRData"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR = ListConfirmedTransactionsByAddressFromTimestampEVMHistoryR;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistoryR.js.map