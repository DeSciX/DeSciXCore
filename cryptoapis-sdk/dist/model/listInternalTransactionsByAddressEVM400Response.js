"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVM400Response = void 0;
var ListInternalTransactionsByAddressEVM400Response = (function () {
    function ListInternalTransactionsByAddressEVM400Response() {
    }
    ListInternalTransactionsByAddressEVM400Response.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVM400Response.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVM400Response.discriminator = undefined;
    ListInternalTransactionsByAddressEVM400Response.attributeTypeMap = [
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
            "type": "ListInternalTransactionsByAddressEVME400"
        }
    ];
    return ListInternalTransactionsByAddressEVM400Response;
}());
exports.ListInternalTransactionsByAddressEVM400Response = ListInternalTransactionsByAddressEVM400Response;
//# sourceMappingURL=listInternalTransactionsByAddressEVM400Response.js.map