"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewConfirmedInternalTransactionsRB = void 0;
var NewConfirmedInternalTransactionsRB = (function () {
    function NewConfirmedInternalTransactionsRB() {
    }
    NewConfirmedInternalTransactionsRB.getAttributeTypeMap = function () {
        return NewConfirmedInternalTransactionsRB.attributeTypeMap;
    };
    NewConfirmedInternalTransactionsRB.discriminator = undefined;
    NewConfirmedInternalTransactionsRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewConfirmedInternalTransactionsRBData"
        }
    ];
    return NewConfirmedInternalTransactionsRB;
}());
exports.NewConfirmedInternalTransactionsRB = NewConfirmedInternalTransactionsRB;
//# sourceMappingURL=newConfirmedInternalTransactionsRB.js.map