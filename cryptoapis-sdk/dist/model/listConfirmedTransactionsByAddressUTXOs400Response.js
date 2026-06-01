"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOs400Response = void 0;
var ListConfirmedTransactionsByAddressUTXOs400Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOs400Response() {
    }
    ListConfirmedTransactionsByAddressUTXOs400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOs400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOs400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOs400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsE400"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOs400Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOs400Response = ListConfirmedTransactionsByAddressUTXOs400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOs400Response.js.map