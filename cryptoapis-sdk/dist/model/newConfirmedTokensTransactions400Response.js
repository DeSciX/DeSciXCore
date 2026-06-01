"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactions400Response = void 0;
var NewConfirmedTokensTransactions400Response = (function () {
    function NewConfirmedTokensTransactions400Response() {
    }
    NewConfirmedTokensTransactions400Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactions400Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactions400Response.discriminator = undefined;
    NewConfirmedTokensTransactions400Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsE400"
        }
    ];
    return NewConfirmedTokensTransactions400Response;
}());
exports.NewConfirmedTokensTransactions400Response = NewConfirmedTokensTransactions400Response;
//# sourceMappingURL=newConfirmedTokensTransactions400Response.js.map