"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmation400Response = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmation400Response = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmation400Response() {
    }
    NewConfirmedTokensTransactionsAndEachConfirmation400Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmation400Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmation400Response.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmation400Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsAndEachConfirmationE400"
        }
    ];
    return NewConfirmedTokensTransactionsAndEachConfirmation400Response;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmation400Response = NewConfirmedTokensTransactionsAndEachConfirmation400Response;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmation400Response.js.map