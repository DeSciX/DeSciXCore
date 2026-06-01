"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOs400Response = void 0;
var ListTransactionsByBlockHashUTXOs400Response = (function () {
    function ListTransactionsByBlockHashUTXOs400Response() {
    }
    ListTransactionsByBlockHashUTXOs400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOs400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOs400Response.discriminator = undefined;
    ListTransactionsByBlockHashUTXOs400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashUTXOsE400"
        }
    ];
    return ListTransactionsByBlockHashUTXOs400Response;
}());
exports.ListTransactionsByBlockHashUTXOs400Response = ListTransactionsByBlockHashUTXOs400Response;
//# sourceMappingURL=listTransactionsByBlockHashUTXOs400Response.js.map