"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactions409Response = void 0;
var NewConfirmedInternalTransactions409Response = (function () {
    function NewConfirmedInternalTransactions409Response() {
    }
    NewConfirmedInternalTransactions409Response.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactions409Response.attributeTypeMap;
    };
    NewConfirmedInternalTransactions409Response.discriminator = undefined;
    NewConfirmedInternalTransactions409Response.attributeTypeMap = [
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
            "type": "NewConfirmedInternalTransactionsE409"
        }
    ];
    return NewConfirmedInternalTransactions409Response;
}());
exports.NewConfirmedInternalTransactions409Response = NewConfirmedInternalTransactions409Response;
//# sourceMappingURL=newConfirmedInternalTransactions409Response.js.map