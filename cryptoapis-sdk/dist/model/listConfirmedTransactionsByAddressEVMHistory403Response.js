"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistory403Response = void 0;
var ListConfirmedTransactionsByAddressEVMHistory403Response = (function () {
    function ListConfirmedTransactionsByAddressEVMHistory403Response() {
    }
    ListConfirmedTransactionsByAddressEVMHistory403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistory403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistory403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistory403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVMHistoryE403"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistory403Response;
}());
exports.ListConfirmedTransactionsByAddressEVMHistory403Response = ListConfirmedTransactionsByAddressEVMHistory403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistory403Response.js.map