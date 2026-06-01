"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsXRPRData = void 0;
var ListHDWalletXPubYPubZPubTransactionsXRPRData = (function () {
    function ListHDWalletXPubYPubZPubTransactionsXRPRData() {
    }
    ListHDWalletXPubYPubZPubTransactionsXRPRData.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsXRPRData.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsXRPRData.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsXRPRData.attributeTypeMap = [
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
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsXRPRI>"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsXRPRData;
}());
exports.ListHDWalletXPubYPubZPubTransactionsXRPRData = ListHDWalletXPubYPubZPubTransactionsXRPRData;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsXRPRData.js.map