"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOs401Response = void 0;
var ListTransactionsByBlockHashUTXOs401Response = (function () {
    function ListTransactionsByBlockHashUTXOs401Response() {
    }
    ListTransactionsByBlockHashUTXOs401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOs401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOs401Response.discriminator = undefined;
    ListTransactionsByBlockHashUTXOs401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashUTXOsE401"
        }
    ];
    return ListTransactionsByBlockHashUTXOs401Response;
}());
exports.ListTransactionsByBlockHashUTXOs401Response = ListTransactionsByBlockHashUTXOs401Response;
//# sourceMappingURL=listTransactionsByBlockHashUTXOs401Response.js.map