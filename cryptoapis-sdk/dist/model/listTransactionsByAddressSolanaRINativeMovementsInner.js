"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRINativeMovementsInner = void 0;
var ListTransactionsByAddressSolanaRINativeMovementsInner = (function () {
    function ListTransactionsByAddressSolanaRINativeMovementsInner() {
    }
    ListTransactionsByAddressSolanaRINativeMovementsInner.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRINativeMovementsInner.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRINativeMovementsInner.discriminator = undefined;
    ListTransactionsByAddressSolanaRINativeMovementsInner.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "recipientAddress",
            "baseName": "recipientAddress",
            "type": "string"
        },
        {
            "name": "senderAddress",
            "baseName": "senderAddress",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "ListTransactionsByAddressSolanaRINativeMovementsInner.UnitEnum"
        }
    ];
    return ListTransactionsByAddressSolanaRINativeMovementsInner;
}());
exports.ListTransactionsByAddressSolanaRINativeMovementsInner = ListTransactionsByAddressSolanaRINativeMovementsInner;
(function (ListTransactionsByAddressSolanaRINativeMovementsInner) {
    var UnitEnum;
    (function (UnitEnum) {
        UnitEnum[UnitEnum["Sol"] = 'SOL'] = "Sol";
    })(UnitEnum = ListTransactionsByAddressSolanaRINativeMovementsInner.UnitEnum || (ListTransactionsByAddressSolanaRINativeMovementsInner.UnitEnum = {}));
})(ListTransactionsByAddressSolanaRINativeMovementsInner || (exports.ListTransactionsByAddressSolanaRINativeMovementsInner = ListTransactionsByAddressSolanaRINativeMovementsInner = {}));
//# sourceMappingURL=listTransactionsByAddressSolanaRINativeMovementsInner.js.map