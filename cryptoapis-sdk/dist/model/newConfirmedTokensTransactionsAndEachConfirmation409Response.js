"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmation409Response = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmation409Response = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmation409Response() {
    }
    NewConfirmedTokensTransactionsAndEachConfirmation409Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmation409Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmation409Response.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmation409Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsAndEachConfirmationE409"
        }
    ];
    return NewConfirmedTokensTransactionsAndEachConfirmation409Response;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmation409Response = NewConfirmedTokensTransactionsAndEachConfirmation409Response;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmation409Response.js.map