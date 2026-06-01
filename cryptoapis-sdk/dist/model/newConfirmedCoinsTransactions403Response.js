"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactions403Response = void 0;
var NewConfirmedCoinsTransactions403Response = (function () {
    function NewConfirmedCoinsTransactions403Response() {
    }
    NewConfirmedCoinsTransactions403Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactions403Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactions403Response.discriminator = undefined;
    NewConfirmedCoinsTransactions403Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsE403"
        }
    ];
    return NewConfirmedCoinsTransactions403Response;
}());
exports.NewConfirmedCoinsTransactions403Response = NewConfirmedCoinsTransactions403Response;
//# sourceMappingURL=newConfirmedCoinsTransactions403Response.js.map