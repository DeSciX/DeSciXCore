"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashEVM401Response = void 0;
var ListTransactionsByBlockHashEVM401Response = (function () {
    function ListTransactionsByBlockHashEVM401Response() {
    }
    ListTransactionsByBlockHashEVM401Response.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashEVM401Response.attributeTypeMap;
    };
    ListTransactionsByBlockHashEVM401Response.discriminator = undefined;
    ListTransactionsByBlockHashEVM401Response.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashEVME401"
        }
    ];
    return ListTransactionsByBlockHashEVM401Response;
}());
exports.ListTransactionsByBlockHashEVM401Response = ListTransactionsByBlockHashEVM401Response;
//# sourceMappingURL=listTransactionsByBlockHashEVM401Response.js.map