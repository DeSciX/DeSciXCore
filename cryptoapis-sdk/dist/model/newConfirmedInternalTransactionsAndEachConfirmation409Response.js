"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsAndEachConfirmation409Response = void 0;
var NewConfirmedInternalTransactionsAndEachConfirmation409Response = (function () {
    function NewConfirmedInternalTransactionsAndEachConfirmation409Response() {
    }
    NewConfirmedInternalTransactionsAndEachConfirmation409Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsAndEachConfirmation409Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsAndEachConfirmation409Response.discriminator = undefined;
    NewConfirmedInternalTransactionsAndEachConfirmation409Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsAndEachConfirmationE409"
        }
    ];
    return NewConfirmedInternalTransactionsAndEachConfirmation409Response;
}());
exports.NewConfirmedInternalTransactionsAndEachConfirmation409Response = NewConfirmedInternalTransactionsAndEachConfirmation409Response;
//# sourceMappingURL=newConfirmedInternalTransactionsAndEachConfirmation409Response.js.map