"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOs401Response = void 0;
var ListUnconfirmedTransactionsByAddressUTXOs401Response = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOs401Response() {
    }
    ListUnconfirmedTransactionsByAddressUTXOs401Response.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOs401Response.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOs401Response.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOs401Response.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsE401"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOs401Response;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOs401Response = ListUnconfirmedTransactionsByAddressUTXOs401Response;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOs401Response.js.map