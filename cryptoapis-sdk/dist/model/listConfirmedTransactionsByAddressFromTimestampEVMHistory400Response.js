"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressFromTimestampEVMHistoryE400"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response = ListConfirmedTransactionsByAddressFromTimestampEVMHistory400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistory400Response.js.map