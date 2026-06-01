"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOs403Response = void 0;
var ListTransactionsByBlockHashUTXOs403Response = (function () {
    function ListTransactionsByBlockHashUTXOs403Response() {
    }
    ListTransactionsByBlockHashUTXOs403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOs403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOs403Response.discriminator = undefined;
    ListTransactionsByBlockHashUTXOs403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashUTXOsE403"
        }
    ];
    return ListTransactionsByBlockHashUTXOs403Response;
}());
exports.ListTransactionsByBlockHashUTXOs403Response = ListTransactionsByBlockHashUTXOs403Response;
//# sourceMappingURL=listTransactionsByBlockHashUTXOs403Response.js.map