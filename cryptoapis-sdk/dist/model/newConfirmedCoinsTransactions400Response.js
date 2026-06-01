"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactions400Response = void 0;
var NewConfirmedCoinsTransactions400Response = (function () {
    function NewConfirmedCoinsTransactions400Response() {
    }
    NewConfirmedCoinsTransactions400Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactions400Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactions400Response.discriminator = undefined;
    NewConfirmedCoinsTransactions400Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsE400"
        }
    ];
    return NewConfirmedCoinsTransactions400Response;
}());
exports.NewConfirmedCoinsTransactions400Response = NewConfirmedCoinsTransactions400Response;
//# sourceMappingURL=newConfirmedCoinsTransactions400Response.js.map