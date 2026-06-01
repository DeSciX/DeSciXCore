"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE403"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response = ListConfirmedTransactionsByAddressFromTimestampEVMHistory403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistory403Response.js.map