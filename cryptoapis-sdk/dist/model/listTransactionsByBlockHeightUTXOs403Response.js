"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOs403Response = void 0;
var ListTransactionsByBlockHeightUTXOs403Response = (function () {
    function ListTransactionsByBlockHeightUTXOs403Response() {
    }
    ListTransactionsByBlockHeightUTXOs403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOs403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOs403Response.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOs403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightUTXOsE403"
        }
    ];
    return ListTransactionsByBlockHeightUTXOs403Response;
}());
exports.ListTransactionsByBlockHeightUTXOs403Response = ListTransactionsByBlockHeightUTXOs403Response;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOs403Response.js.map