"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedTokensTransactionsRB = void 0;
var NewConfirmedTokensTransactionsRB = (function () {
    function NewConfirmedTokensTransactionsRB() {
    }
    NewConfirmedTokensTransactionsRB.getAttributeTypeMap = function () {
        return NewConfirmedTokensTransactionsRB.attributeTypeMap;
    };
    NewConfirmedTokensTransactionsRB.discriminator = undefined;
    NewConfirmedTokensTransactionsRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewConfirmedTokensTransactionsRBData"
        }
    ];
    return NewConfirmedTokensTransactionsRB;
}());
exports.NewConfirmedTokensTransactionsRB = NewConfirmedTokensTransactionsRB;
//# sourceMappingURL=newConfirmedTokensTransactionsRB.js.map