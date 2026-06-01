"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistory401Response = void 0;
var ListConfirmedTransactionsByAddressEVMHistory401Response = (function () {
    function ListConfirmedTransactionsByAddressEVMHistory401Response() {
    }
    ListConfirmedTransactionsByAddressEVMHistory401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistory401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistory401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistory401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVMHistoryE401"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistory401Response;
}());
exports.ListConfirmedTransactionsByAddressEVMHistory401Response = ListConfirmedTransactionsByAddressEVMHistory401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistory401Response.js.map