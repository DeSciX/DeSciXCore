"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolana403Response = void 0;
var ListTransactionsByAddressSolana403Response = (function () {
    function ListTransactionsByAddressSolana403Response() {
    }
    ListTransactionsByAddressSolana403Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolana403Response.attributeTypeMap;
    };
    ListTransactionsByAddressSolana403Response.discriminator = undefined;
    ListTransactionsByAddressSolana403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressSolanaE403"
        }
    ];
    return ListTransactionsByAddressSolana403Response;
}());
exports.ListTransactionsByAddressSolana403Response = ListTransactionsByAddressSolana403Response;
//# sourceMappingURL=listTransactionsByAddressSolana403Response.js.map