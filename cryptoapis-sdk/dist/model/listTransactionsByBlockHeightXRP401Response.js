"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightXRP401Response = void 0;
var ListTransactionsByBlockHeightXRP401Response = (function () {
    function ListTransactionsByBlockHeightXRP401Response() {
    }
    ListTransactionsByBlockHeightXRP401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightXRP401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHeightXRP401Response.discriminator = undefined;
    ListTransactionsByBlockHeightXRP401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightXRPE401"
        }
    ];
    return ListTransactionsByBlockHeightXRP401Response;
}());
exports.ListTransactionsByBlockHeightXRP401Response = ListTransactionsByBlockHeightXRP401Response;
//# sourceMappingURL=listTransactionsByBlockHeightXRP401Response.js.map