"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewUnconfirmedCoinsTransactionsRB = void 0;
var NewUnconfirmedCoinsTransactionsRB = (function () {
    function NewUnconfirmedCoinsTransactionsRB() {
    }
    NewUnconfirmedCoinsTransactionsRB.getAttributeTypeMap = function () {
        return NewUnconfirmedCoinsTransactionsRB.attributeTypeMap;
    };
    NewUnconfirmedCoinsTransactionsRB.discriminator = undefined;
    NewUnconfirmedCoinsTransactionsRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewUnconfirmedCoinsTransactionsRBData"
        }
    ];
    return NewUnconfirmedCoinsTransactionsRB;
}());
exports.NewUnconfirmedCoinsTransactionsRB = NewUnconfirmedCoinsTransactionsRB;
//# sourceMappingURL=newUnconfirmedCoinsTransactionsRB.js.map