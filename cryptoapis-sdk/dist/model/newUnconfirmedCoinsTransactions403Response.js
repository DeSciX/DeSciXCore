"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactions403Response = void 0;
var NewUnconfirmedCoinsTransactions403Response = (function () {
    function NewUnconfirmedCoinsTransactions403Response() {
    }
    NewUnconfirmedCoinsTransactions403Response.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactions403Response.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactions403Response.discriminator = undefined;
    NewUnconfirmedCoinsTransactions403Response.attributeTypeMap = [
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
            "type": "NewUnconfirmedCoinsTransactionsE403"
        }
    ];
    return NewUnconfirmedCoinsTransactions403Response;
}());
exports.NewUnconfirmedCoinsTransactions403Response = NewUnconfirmedCoinsTransactions403Response;
//# sourceMappingURL=newUnconfirmedCoinsTransactions403Response.js.map