"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsUTXORData = void 0;
var ListHDWalletXPubYPubZPubTransactionsUTXORData = (function () {
    function ListHDWalletXPubYPubZPubTransactionsUTXORData() {
    }
    ListHDWalletXPubYPubZPubTransactionsUTXORData.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsUTXORData.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsUTXORData.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsUTXORData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsUTXORI>"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsUTXORData;
}());
exports.ListHDWalletXPubYPubZPubTransactionsUTXORData = ListHDWalletXPubYPubZPubTransactionsUTXORData;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsUTXORData.js.map