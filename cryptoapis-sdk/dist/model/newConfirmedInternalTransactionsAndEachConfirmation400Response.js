"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmation400Response = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmation400Response = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmation400Response() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmation400Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmation400Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmation400Response.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmation400Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsAndEachConfirmationE400"
        }
    ];
    return NewConfirmedInternalTransactionsAndEachConfirmation400Response;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmation400Response = NewConfirmedInternalTransactionsAndEachConfirmation400Response;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmation400Response.js.map