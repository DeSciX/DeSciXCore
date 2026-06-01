"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOs401Response = void 0;
var ListUnspentTransactionOutputsByAddressUTXOs401Response = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOs401Response() {
    }
    ListUnspentTransactionOutputsByAddressUTXOs401Response.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOs401Response.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOs401Response.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOs401Response.attributeTypeMap = [
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
            "type": "ListUnspentTransactionOutputsByAddressUTXOsE401"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOs401Response;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOs401Response = ListUnspentTransactionOutputsByAddressUTXOs401Response;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOs401Response.js.map