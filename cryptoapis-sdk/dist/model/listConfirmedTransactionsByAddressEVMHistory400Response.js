"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMHistory400Response = void 0;
var ListConfirmedTransactionsByAddressEVMHistory400Response = (function () {
    function ListConfirmedTransactionsByAddressEVMHistory400Response() {
    }
    ListConfirmedTransactionsByAddressEVMHistory400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMHistory400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMHistory400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMHistory400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVMHistoryE400"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMHistory400Response;
}());
exports.ListConfirmedTransactionsByAddressEVMHistory400Response = ListConfirmedTransactionsByAddressEVMHistory400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMHistory400Response.js.map