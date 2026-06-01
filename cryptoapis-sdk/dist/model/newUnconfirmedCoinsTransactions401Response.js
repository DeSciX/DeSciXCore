"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactions401Response = void 0;
var NewUnconfirmedCoinsTransactions401Response = (function () {
    function NewUnconfirmedCoinsTransactions401Response() {
    }
    NewUnconfirmedCoinsTransactions401Response.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactions401Response.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactions401Response.discriminator = undefined;
    NewUnconfirmedCoinsTransactions401Response.attributeTypeMap = [
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
            "type": "NewUnconfirmedCoinsTransactionsE401"
        }
    ];
    return NewUnconfirmedCoinsTransactions401Response;
}());
exports.NewUnconfirmedCoinsTransactions401Response = NewUnconfirmedCoinsTransactions401Response;
//# sourceMappingURL=newUnconfirmedCoinsTransactions401Response.js.map