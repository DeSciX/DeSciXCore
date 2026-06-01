"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVM400Response = void 0;
var ListTransactionsByBlockHashEVM400Response = (function () {
    function ListTransactionsByBlockHashEVM400Response() {
    }
    ListTransactionsByBlockHashEVM400Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVM400Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVM400Response.discriminator = undefined;
    ListTransactionsByBlockHashEVM400Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashEVME400"
        }
    ];
    return ListTransactionsByBlockHashEVM400Response;
}());
exports.ListTransactionsByBlockHashEVM400Response = ListTransactionsByBlockHashEVM400Response;
//# sourceMappingURL=listTransactionsByBlockHashEVM400Response.js.map