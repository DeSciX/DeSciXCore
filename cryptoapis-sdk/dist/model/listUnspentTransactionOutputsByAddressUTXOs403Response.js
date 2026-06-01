"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOs403Response = void 0;
var ListUnspentTransactionOutputsByAddressUTXOs403Response = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOs403Response() {
    }
    ListUnspentTransactionOutputsByAddressUTXOs403Response.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOs403Response.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOs403Response.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOs403Response.attributeTypeMap = [
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
            "type": "ListUnspentTransactionOutputsByAddressUTXOsE403"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOs403Response;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOs403Response = ListUnspentTransactionOutputsByAddressUTXOs403Response;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOs403Response.js.map