"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOs403Response = void 0;
var ListConfirmedTransactionsByAddressUTXOs403Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOs403Response() {
    }
    ListConfirmedTransactionsByAddressUTXOs403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOs403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOs403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOs403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsE403"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOs403Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOs403Response = ListConfirmedTransactionsByAddressUTXOs403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOs403Response.js.map