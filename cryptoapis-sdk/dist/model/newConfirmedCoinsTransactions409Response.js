"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactions409Response = void 0;
var NewConfirmedCoinsTransactions409Response = (function () {
    function NewConfirmedCoinsTransactions409Response() {
    }
    NewConfirmedCoinsTransactions409Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactions409Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactions409Response.discriminator = undefined;
    NewConfirmedCoinsTransactions409Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsE409"
        }
    ];
    return NewConfirmedCoinsTransactions409Response;
}());
exports.NewConfirmedCoinsTransactions409Response = NewConfirmedCoinsTransactions409Response;
//# sourceMappingURL=newConfirmedCoinsTransactions409Response.js.map