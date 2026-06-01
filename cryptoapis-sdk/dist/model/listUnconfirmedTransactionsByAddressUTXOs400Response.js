"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOs400Response = void 0;
var ListUnconfirmedTransactionsByAddressUTXOs400Response = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOs400Response() {
    }
    ListUnconfirmedTransactionsByAddressUTXOs400Response.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOs400Response.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOs400Response.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOs400Response.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsE400"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOs400Response;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOs400Response = ListUnconfirmedTransactionsByAddressUTXOs400Response;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOs400Response.js.map