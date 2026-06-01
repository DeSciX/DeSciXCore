"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRP403Response = void 0;
var ListTransactionsByBlockHashXRP403Response = (function () {
    function ListTransactionsByBlockHashXRP403Response() {
    }
    ListTransactionsByBlockHashXRP403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRP403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRP403Response.discriminator = undefined;
    ListTransactionsByBlockHashXRP403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashXRPE403"
        }
    ];
    return ListTransactionsByBlockHashXRP403Response;
}());
exports.ListTransactionsByBlockHashXRP403Response = ListTransactionsByBlockHashXRP403Response;
//# sourceMappingURL=listTransactionsByBlockHashXRP403Response.js.map