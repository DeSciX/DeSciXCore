"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsAndEachConfirmation401Response = void 0;
var NewConfirmedCoinsTransactionsAndEachConfirmation401Response = (function () {
    function NewConfirmedCoinsTransactionsAndEachConfirmation401Response() {
    }
    NewConfirmedCoinsTransactionsAndEachConfirmation401Response.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsAndEachConfirmation401Response.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsAndEachConfirmation401Response.discriminator = undefined;
    NewConfirmedCoinsTransactionsAndEachConfirmation401Response.attributeTypeMap = [
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
            "type": "NewConfirmedCoinsTransactionsAndEachConfirmationE401"
        }
    ];
    return NewConfirmedCoinsTransactionsAndEachConfirmation401Response;
}());
exports.NewConfirmedCoinsTransactionsAndEachConfirmation401Response = NewConfirmedCoinsTransactionsAndEachConfirmation401Response;
//# sourceMappingURL=newConfirmedCoinsTransactionsAndEachConfirmation401Response.js.map