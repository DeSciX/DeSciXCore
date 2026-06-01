"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolana401Response = void 0;
var ListTransactionsByAddressSolana401Response = (function () {
    function ListTransactionsByAddressSolana401Response() {
    }
    ListTransactionsByAddressSolana401Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolana401Response.attributeTypeMap;
    };
    ListTransactionsByAddressSolana401Response.discriminator = undefined;
    ListTransactionsByAddressSolana401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressSolanaE401"
        }
    ];
    return ListTransactionsByAddressSolana401Response;
}());
exports.ListTransactionsByAddressSolana401Response = ListTransactionsByAddressSolana401Response;
//# sourceMappingURL=listTransactionsByAddressSolana401Response.js.map