"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactions409Response = void 0;
var NewUnconfirmedCoinsTransactions409Response = (function () {
    function NewUnconfirmedCoinsTransactions409Response() {
    }
    NewUnconfirmedCoinsTransactions409Response.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactions409Response.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactions409Response.discriminator = undefined;
    NewUnconfirmedCoinsTransactions409Response.attributeTypeMap = [
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
            "type": "NewUnconfirmedCoinsTransactionsE409"
        }
    ];
    return NewUnconfirmedCoinsTransactions409Response;
}());
exports.NewUnconfirmedCoinsTransactions409Response = NewUnconfirmedCoinsTransactions409Response;
//# sourceMappingURL=newUnconfirmedCoinsTransactions409Response.js.map