"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response = void 0;
var ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response = (function () {
    function ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response() {
    }
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response.attributeTypeMap = [
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
            "type": "SyncAddressNotActive"
        }
    ];
    return ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response;
}());
exports.ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response = ListConfirmedTransactionsByAddressFromTimestampEVMHistory405Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressFromTimestampEVMHistory405Response.js.map