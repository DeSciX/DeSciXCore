"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVM403Response = void 0;
var ListInternalTransactionsByAddressEVM403Response = (function () {
    function ListInternalTransactionsByAddressEVM403Response() {
    }
    ListInternalTransactionsByAddressEVM403Response.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVM403Response.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVM403Response.discriminator = undefined;
    ListInternalTransactionsByAddressEVM403Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionsByAddressEVME403"
        }
    ];
    return ListInternalTransactionsByAddressEVM403Response;
}());
exports.ListInternalTransactionsByAddressEVM403Response = ListInternalTransactionsByAddressEVM403Response;
//# sourceMappingURL=listInternalTransactionsByAddressEVM403Response.js.map