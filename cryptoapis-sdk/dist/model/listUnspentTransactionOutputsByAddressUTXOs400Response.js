"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOs400Response = void 0;
var ListUnspentTransactionOutputsByAddressUTXOs400Response = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOs400Response() {
    }
    ListUnspentTransactionOutputsByAddressUTXOs400Response.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOs400Response.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOs400Response.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOs400Response.attributeTypeMap = [
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
            "type": "ListUnspentTransactionOutputsByAddressUTXOsE400"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOs400Response;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOs400Response = ListUnspentTransactionOutputsByAddressUTXOs400Response;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOs400Response.js.map