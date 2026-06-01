"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRP401Response = void 0;
var ListTransactionsByAddressXRP401Response = (function () {
    function ListTransactionsByAddressXRP401Response() {
    }
    ListTransactionsByAddressXRP401Response.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRP401Response.attributeTypeMap;
    };
    ListTransactionsByAddressXRP401Response.discriminator = undefined;
    ListTransactionsByAddressXRP401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressXRPE401"
        }
    ];
    return ListTransactionsByAddressXRP401Response;
}());
exports.ListTransactionsByAddressXRP401Response = ListTransactionsByAddressXRP401Response;
//# sourceMappingURL=listTransactionsByAddressXRP401Response.js.map