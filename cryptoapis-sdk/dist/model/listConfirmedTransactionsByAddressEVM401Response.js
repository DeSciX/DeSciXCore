"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVM401Response = void 0;
var ListConfirmedTransactionsByAddressEVM401Response = (function () {
    function ListConfirmedTransactionsByAddressEVM401Response() {
    }
    ListConfirmedTransactionsByAddressEVM401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVM401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVM401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVM401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVME401"
        }
    ];
    return ListConfirmedTransactionsByAddressEVM401Response;
}());
exports.ListConfirmedTransactionsByAddressEVM401Response = ListConfirmedTransactionsByAddressEVM401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVM401Response.js.map