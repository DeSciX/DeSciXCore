"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRP400Response = void 0;
var ListTransactionsByAddressXRP400Response = (function () {
    function ListTransactionsByAddressXRP400Response() {
    }
    ListTransactionsByAddressXRP400Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRP400Response.attributeTypeMap;
    };
    ListTransactionsByAddressXRP400Response.discriminator = undefined;
    ListTransactionsByAddressXRP400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressXRPE400"
        }
    ];
    return ListTransactionsByAddressXRP400Response;
}());
exports.ListTransactionsByAddressXRP400Response = ListTransactionsByAddressXRP400Response;
//# sourceMappingURL=listTransactionsByAddressXRP400Response.js.map