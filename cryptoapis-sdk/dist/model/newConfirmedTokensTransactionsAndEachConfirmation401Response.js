"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsAndEachConfirmation401Response = void 0;
var NewConfirmedTokensTransactionsAndEachConfirmation401Response = (function () {
    function NewConfirmedTokensTransactionsAndEachConfirmation401Response() {
    }
    NewConfirmedTokensTransactionsAndEachConfirmation401Response.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsAndEachConfirmation401Response.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsAndEachConfirmation401Response.discriminator = undefined;
    NewConfirmedTokensTransactionsAndEachConfirmation401Response.attributeTypeMap = [
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
            "type": "NewConfirmedTokensTransactionsAndEachConfirmationE401"
        }
    ];
    return NewConfirmedTokensTransactionsAndEachConfirmation401Response;
}());
exports.NewConfirmedTokensTransactionsAndEachConfirmation401Response = NewConfirmedTokensTransactionsAndEachConfirmation401Response;
//# sourceMappingURL=newConfirmedTokensTransactionsAndEachConfirmation401Response.js.map