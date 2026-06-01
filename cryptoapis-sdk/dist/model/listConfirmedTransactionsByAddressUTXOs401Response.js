"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOs401Response = void 0;
var ListConfirmedTransactionsByAddressUTXOs401Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOs401Response() {
    }
    ListConfirmedTransactionsByAddressUTXOs401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOs401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOs401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOs401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsE401"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOs401Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOs401Response = ListConfirmedTransactionsByAddressUTXOs401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOs401Response.js.map