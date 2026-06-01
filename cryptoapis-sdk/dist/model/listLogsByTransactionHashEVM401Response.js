"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVM401Response = void 0;
var ListLogsByTransactionHashEVM401Response = (function () {
    function ListLogsByTransactionHashEVM401Response() {
    }
    ListLogsByTransactionHashEVM401Response.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVM401Response.attributeTypeMap;
    };
    ListLogsByTransactionHashEVM401Response.discriminator = undefined;
    ListLogsByTransactionHashEVM401Response.attributeTypeMap = [
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
            "type": "ListLogsByTransactionHashEVME401"
        }
    ];
    return ListLogsByTransactionHashEVM401Response;
}());
exports.ListLogsByTransactionHashEVM401Response = ListLogsByTransactionHashEVM401Response;
//# sourceMappingURL=listLogsByTransactionHashEVM401Response.js.map