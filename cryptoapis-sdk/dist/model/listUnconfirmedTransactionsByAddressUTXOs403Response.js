"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOs403Response = void 0;
var ListUnconfirmedTransactionsByAddressUTXOs403Response = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOs403Response() {
    }
    ListUnconfirmedTransactionsByAddressUTXOs403Response.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOs403Response.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOs403Response.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOs403Response.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsE403"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOs403Response;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOs403Response = ListUnconfirmedTransactionsByAddressUTXOs403Response;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOs403Response.js.map