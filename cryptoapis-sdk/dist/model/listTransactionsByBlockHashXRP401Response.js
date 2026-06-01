"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashXRP401Response = void 0;
var ListTransactionsByBlockHashXRP401Response = (function () {
    function ListTransactionsByBlockHashXRP401Response() {
    }
    ListTransactionsByBlockHashXRP401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashXRP401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashXRP401Response.discriminator = undefined;
    ListTransactionsByBlockHashXRP401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashXRPE401"
        }
    ];
    return ListTransactionsByBlockHashXRP401Response;
}());
exports.ListTransactionsByBlockHashXRP401Response = ListTransactionsByBlockHashXRP401Response;
//# sourceMappingURL=listTransactionsByBlockHashXRP401Response.js.map