"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVM400Response = void 0;
var ListConfirmedTransactionsByAddressEVM400Response = (function () {
    function ListConfirmedTransactionsByAddressEVM400Response() {
    }
    ListConfirmedTransactionsByAddressEVM400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVM400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVM400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVM400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVME400"
        }
    ];
    return ListConfirmedTransactionsByAddressEVM400Response;
}());
exports.ListConfirmedTransactionsByAddressEVM400Response = ListConfirmedTransactionsByAddressEVM400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVM400Response.js.map