"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactions403Response = void 0;
var NewConfirmedTokensTransactions403Response = (function () {
    function NewConfirmedTokensTransactions403Response() {
    }
    NewConfirmedTokensTransactions403Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactions403Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactions403Response.discriminator = undefined;
    NewConfirmedTokensTransactions403Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsE403"
        }
    ];
    return NewConfirmedTokensTransactions403Response;
}());
exports.NewConfirmedTokensTransactions403Response = NewConfirmedTokensTransactions403Response;
//# sourceMappingURL=newConfirmedTokensTransactions403Response.js.map