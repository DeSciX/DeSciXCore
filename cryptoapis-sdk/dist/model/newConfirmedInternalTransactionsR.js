"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsR = void 0;
var NewConfirmedInternalTransactionsR = (function () {
    function NewConfirmedInternalTransactionsR() {
    }
    NewConfirmedInternalTransactionsR.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsR.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsR.discriminator = undefined;
    NewConfirmedInternalTransactionsR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "NewConfirmedInternalTransactionsRData"
        }
    ];
    return NewConfirmedInternalTransactionsR;
}());
exports.NewConfirmedInternalTransactionsR = NewConfirmedInternalTransactionsR;
//# sourceMappingURL=newConfirmedInternalTransactionsR.js.map