"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRP403Response = void 0;
var ListTransactionsByAddressXRP403Response = (function () {
    function ListTransactionsByAddressXRP403Response() {
    }
    ListTransactionsByAddressXRP403Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRP403Response.attributeTypeMap;
    };
    ListTransactionsByAddressXRP403Response.discriminator = undefined;
    ListTransactionsByAddressXRP403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressXRPE403"
        }
    ];
    return ListTransactionsByAddressXRP403Response;
}());
exports.ListTransactionsByAddressXRP403Response = ListTransactionsByAddressXRP403Response;
//# sourceMappingURL=listTransactionsByAddressXRP403Response.js.map