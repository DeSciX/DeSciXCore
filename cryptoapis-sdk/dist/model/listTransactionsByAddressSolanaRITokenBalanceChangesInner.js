"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRITokenBalanceChangesInner = void 0;
var ListTransactionsByAddressSolanaRITokenBalanceChangesInner = (function () {
    function ListTransactionsByAddressSolanaRITokenBalanceChangesInner() {
    }
    ListTransactionsByAddressSolanaRITokenBalanceChangesInner.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRITokenBalanceChangesInner.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRITokenBalanceChangesInner.discriminator = undefined;
    ListTransactionsByAddressSolanaRITokenBalanceChangesInner.attributeTypeMap = [
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
            "name": "contractAddress",
            "baseName": "contractAddress",
            "type": "string"
        },
        {
            "name": "tokenAddress",
            "baseName": "tokenAddress",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "ListTransactionsByAddressSolanaRITokenBalanceChangesInner.TypeEnum"
        }
    ];
    return ListTransactionsByAddressSolanaRITokenBalanceChangesInner;
}());
exports.ListTransactionsByAddressSolanaRITokenBalanceChangesInner = ListTransactionsByAddressSolanaRITokenBalanceChangesInner;
(function (ListTransactionsByAddressSolanaRITokenBalanceChangesInner) {
    var TypeEnum;
    (function (TypeEnum) {
        TypeEnum[TypeEnum["Spl"] = 'spl'] = "Spl";
    })(TypeEnum = ListTransactionsByAddressSolanaRITokenBalanceChangesInner.TypeEnum || (ListTransactionsByAddressSolanaRITokenBalanceChangesInner.TypeEnum = {}));
})(ListTransactionsByAddressSolanaRITokenBalanceChangesInner || (exports.ListTransactionsByAddressSolanaRITokenBalanceChangesInner = ListTransactionsByAddressSolanaRITokenBalanceChangesInner = {}));
//# sourceMappingURL=listTransactionsByAddressSolanaRITokenBalanceChangesInner.js.map