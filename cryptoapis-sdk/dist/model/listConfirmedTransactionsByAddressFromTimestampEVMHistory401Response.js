"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE401"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response = ListConfirmedTransactionsByAddressFromTimestampEVMHistory401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistory401Response.js.map