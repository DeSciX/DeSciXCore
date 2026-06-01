"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVM403Response = void 0;
var ListTransactionsByBlockHashEVM403Response = (function () {
    function ListTransactionsByBlockHashEVM403Response() {
    }
    ListTransactionsByBlockHashEVM403Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVM403Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVM403Response.discriminator = undefined;
    ListTransactionsByBlockHashEVM403Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashEVME403"
        }
    ];
    return ListTransactionsByBlockHashEVM403Response;
}());
exports.ListTransactionsByBlockHashEVM403Response = ListTransactionsByBlockHashEVM403Response;
//# sourceMappingURL=listTransactionsByBlockHashEVM403Response.js.map