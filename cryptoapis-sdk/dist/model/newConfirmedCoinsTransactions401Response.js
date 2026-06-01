"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactions401Response = void 0;
var NewConfirmedCoinsTransactions401Response = (function () {
    function NewConfirmedCoinsTransactions401Response() {
    }
    NewConfirmedCoinsTransactions401Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactions401Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactions401Response.discriminator = undefined;
    NewConfirmedCoinsTransactions401Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsE401"
        }
    ];
    return NewConfirmedCoinsTransactions401Response;
}());
exports.NewConfirmedCoinsTransactions401Response = NewConfirmedCoinsTransactions401Response;
//# sourceMappingURL=newConfirmedCoinsTransactions401Response.js.map