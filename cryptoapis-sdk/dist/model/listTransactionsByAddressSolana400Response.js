"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolana400Response = void 0;
var ListTransactionsByAddressSolana400Response = (function () {
    function ListTransactionsByAddressSolana400Response() {
    }
    ListTransactionsByAddressSolana400Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolana400Response.attributeTypeMap;
    };
    ListTransactionsByAddressSolana400Response.discriminator = undefined;
    ListTransactionsByAddressSolana400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressSolanaE400"
        }
    ];
    return ListTransactionsByAddressSolana400Response;
}());
exports.ListTransactionsByAddressSolana400Response = ListTransactionsByAddressSolana400Response;
//# sourceMappingURL=listTransactionsByAddressSolana400Response.js.map