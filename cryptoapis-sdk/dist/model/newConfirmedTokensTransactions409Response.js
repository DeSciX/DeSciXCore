"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactions409Response = void 0;
var NewConfirmedTokensTransactions409Response = (function () {
    function NewConfirmedTokensTransactions409Response() {
    }
    NewConfirmedTokensTransactions409Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactions409Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactions409Response.discriminator = undefined;
    NewConfirmedTokensTransactions409Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsE409"
        }
    ];
    return NewConfirmedTokensTransactions409Response;
}());
exports.NewConfirmedTokensTransactions409Response = NewConfirmedTokensTransactions409Response;
//# sourceMappingURL=newConfirmedTokensTransactions409Response.js.map