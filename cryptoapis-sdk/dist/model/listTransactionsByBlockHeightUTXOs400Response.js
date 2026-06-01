"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOs400Response = void 0;
var ListTransactionsByBlockHeightUTXOs400Response = (function () {
    function ListTransactionsByBlockHeightUTXOs400Response() {
    }
    ListTransactionsByBlockHeightUTXOs400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOs400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOs400Response.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOs400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightUTXOsE400"
        }
    ];
    return ListTransactionsByBlockHeightUTXOs400Response;
}());
exports.ListTransactionsByBlockHeightUTXOs400Response = ListTransactionsByBlockHeightUTXOs400Response;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOs400Response.js.map