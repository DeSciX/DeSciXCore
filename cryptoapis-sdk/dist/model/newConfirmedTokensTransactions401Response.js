"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactions401Response = void 0;
var NewConfirmedTokensTransactions401Response = (function () {
    function NewConfirmedTokensTransactions401Response() {
    }
    NewConfirmedTokensTransactions401Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactions401Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactions401Response.discriminator = undefined;
    NewConfirmedTokensTransactions401Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsE401"
        }
    ];
    return NewConfirmedTokensTransactions401Response;
}());
exports.NewConfirmedTokensTransactions401Response = NewConfirmedTokensTransactions401Response;
//# sourceMappingURL=newConfirmedTokensTransactions401Response.js.map