"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVM401Response = void 0;
var ListInternalTransactionsByAddressEVM401Response = (function () {
    function ListInternalTransactionsByAddressEVM401Response() {
    }
    ListInternalTransactionsByAddressEVM401Response.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVM401Response.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVM401Response.discriminator = undefined;
    ListInternalTransactionsByAddressEVM401Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionsByAddressEVME401"
        }
    ];
    return ListInternalTransactionsByAddressEVM401Response;
}());
exports.ListInternalTransactionsByAddressEVM401Response = ListInternalTransactionsByAddressEVM401Response;
//# sourceMappingURL=listInternalTransactionsByAddressEVM401Response.js.map