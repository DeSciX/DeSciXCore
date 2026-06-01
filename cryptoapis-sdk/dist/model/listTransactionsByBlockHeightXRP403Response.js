"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRP403Response = void 0;
var ListTransactionsByBlockHeightXRP403Response = (function () {
    function ListTransactionsByBlockHeightXRP403Response() {
    }
    ListTransactionsByBlockHeightXRP403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRP403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRP403Response.discriminator = undefined;
    ListTransactionsByBlockHeightXRP403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightXRPE403"
        }
    ];
    return ListTransactionsByBlockHeightXRP403Response;
}());
exports.ListTransactionsByBlockHeightXRP403Response = ListTransactionsByBlockHeightXRP403Response;
//# sourceMappingURL=listTransactionsByBlockHeightXRP403Response.js.map