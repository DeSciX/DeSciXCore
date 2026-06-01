"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRINativeBalanceChangesInner = void 0;
var ListTransactionsByAddressSolanaRINativeBalanceChangesInner = (function () {
    function ListTransactionsByAddressSolanaRINativeBalanceChangesInner() {
    }
    ListTransactionsByAddressSolanaRINativeBalanceChangesInner.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRINativeBalanceChangesInner.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRINativeBalanceChangesInner.discriminator = undefined;
    ListTransactionsByAddressSolanaRINativeBalanceChangesInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "after",
            "baseName": "after",
            "type": "string"
        },
        {
            "name": "before",
            "baseName": "before",
            "type": "string"
        },
        {
            "name": "change",
            "baseName": "change",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "ListTransactionsByAddressSolanaRINativeBalanceChangesInner.TypeEnum"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "ListTransactionsByAddressSolanaRINativeBalanceChangesInner.UnitEnum"
        }
    ];
    return ListTransactionsByAddressSolanaRINativeBalanceChangesInner;
}());
exports.ListTransactionsByAddressSolanaRINativeBalanceChangesInner = ListTransactionsByAddressSolanaRINativeBalanceChangesInner;
(function (ListTransactionsByAddressSolanaRINativeBalanceChangesInner) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Native"] = 'native'] = "Native";
    })(TypeEnum = ListTransactionsByAddressSolanaRINativeBalanceChangesInner.TypeEnum || (ListTransactionsByAddressSolanaRINativeBalanceChangesInner.TypeEnum = {}));
    var UnitEnum;
    (function (UnitEnum) {
        UnitEnum[UnitEnum["Sol"] = 'SOL'] = "Sol";
    })(UnitEnum = ListTransactionsByAddressSolanaRINativeBalanceChangesInner.UnitEnum || (ListTransactionsByAddressSolanaRINativeBalanceChangesInner.UnitEnum = {}));
})(ListTransactionsByAddressSolanaRINativeBalanceChangesInner || (exports.ListTransactionsByAddressSolanaRINativeBalanceChangesInner = ListTransactionsByAddressSolanaRINativeBalanceChangesInner = {}));
//# sourceMappingURL=listTransactionsByAddressSolanaRINativeBalanceChangesInner.js.map