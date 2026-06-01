"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVM403Response = void 0;
var ListConfirmedTransactionsByAddressEVM403Response = (function () {
    function ListConfirmedTransactionsByAddressEVM403Response() {
    }
    ListConfirmedTransactionsByAddressEVM403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVM403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVM403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVM403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVME403"
        }
    ];
    return ListConfirmedTransactionsByAddressEVM403Response;
}());
exports.ListConfirmedTransactionsByAddressEVM403Response = ListConfirmedTransactionsByAddressEVM403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVM403Response.js.map