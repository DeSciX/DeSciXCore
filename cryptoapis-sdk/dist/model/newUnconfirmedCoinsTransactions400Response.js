"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactions400Response = void 0;
var NewUnconfirmedCoinsTransactions400Response = (function () {
    function NewUnconfirmedCoinsTransactions400Response() {
    }
    NewUnconfirmedCoinsTransactions400Response.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactions400Response.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactions400Response.discriminator = undefined;
    NewUnconfirmedCoinsTransactions400Response.attributeTypeMap = [
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
            "type": "NewUnconfirmedCoinsTransactionsE400"
        }
    ];
    return NewUnconfirmedCoinsTransactions400Response;
}());
exports.NewUnconfirmedCoinsTransactions400Response = NewUnconfirmedCoinsTransactions400Response;
//# sourceMappingURL=newUnconfirmedCoinsTransactions400Response.js.map