"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedCoinsTransactionsRB = void 0;
var NewConfirmedCoinsTransactionsRB = (function () {
    function NewConfirmedCoinsTransactionsRB() {
    }
    NewConfirmedCoinsTransactionsRB.getAttributeTypeMap = function () {
        return NewConfirmedCoinsTransactionsRB.attributeTypeMap;
    };
    NewConfirmedCoinsTransactionsRB.discriminator = undefined;
    NewConfirmedCoinsTransactionsRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewConfirmedCoinsTransactionsRBData"
        }
    ];
    return NewConfirmedCoinsTransactionsRB;
}());
exports.NewConfirmedCoinsTransactionsRB = NewConfirmedCoinsTransactionsRB;
//# sourceMappingURL=newConfirmedCoinsTransactionsRB.js.map