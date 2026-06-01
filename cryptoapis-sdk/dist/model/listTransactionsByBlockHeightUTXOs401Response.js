"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOs401Response = void 0;
var ListTransactionsByBlockHeightUTXOs401Response = (function () {
    function ListTransactionsByBlockHeightUTXOs401Response() {
    }
    ListTransactionsByBlockHeightUTXOs401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOs401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOs401Response.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOs401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightUTXOsE401"
        }
    ];
    return ListTransactionsByBlockHeightUTXOs401Response;
}());
exports.ListTransactionsByBlockHeightUTXOs401Response = ListTransactionsByBlockHeightUTXOs401Response;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOs401Response.js.map