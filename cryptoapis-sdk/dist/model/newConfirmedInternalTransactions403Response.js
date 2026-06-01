"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactions403Response = void 0;
var NewConfirmedInternalTransactions403Response = (function () {
    function NewConfirmedInternalTransactions403Response() {
    }
    NewConfirmedInternalTransactions403Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactions403Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactions403Response.discriminator = undefined;
    NewConfirmedInternalTransactions403Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsE403"
        }
    ];
    return NewConfirmedInternalTransactions403Response;
}());
exports.NewConfirmedInternalTransactions403Response = NewConfirmedInternalTransactions403Response;
//# sourceMappingURL=newConfirmedInternalTransactions403Response.js.map