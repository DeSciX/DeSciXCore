"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRP400Response = void 0;
var ListTransactionsByBlockHeightXRP400Response = (function () {
    function ListTransactionsByBlockHeightXRP400Response() {
    }
    ListTransactionsByBlockHeightXRP400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRP400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRP400Response.discriminator = undefined;
    ListTransactionsByBlockHeightXRP400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightXRPE400"
        }
    ];
    return ListTransactionsByBlockHeightXRP400Response;
}());
exports.ListTransactionsByBlockHeightXRP400Response = ListTransactionsByBlockHeightXRP400Response;
//# sourceMappingURL=listTransactionsByBlockHeightXRP400Response.js.map