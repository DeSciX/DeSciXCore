"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubTransactionsEVMRData = void 0;
var ListHDWalletXPubYPubZPubTransactionsEVMRData = (function () {
    function ListHDWalletXPubYPubZPubTransactionsEVMRData() {
    }
    ListHDWalletXPubYPubZPubTransactionsEVMRData.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubTransactionsEVMRData.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubTransactionsEVMRData.discriminator = undefined;
    ListHDWalletXPubYPubZPubTransactionsEVMRData.attributeTypeMap = [
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
            "type": "Array<ListHDWalletXPubYPubZPubTransactionsEVMRI>"
        }
    ];
    return ListHDWalletXPubYPubZPubTransactionsEVMRData;
}());
exports.ListHDWalletXPubYPubZPubTransactionsEVMRData = ListHDWalletXPubYPubZPubTransactionsEVMRData;
//# sourceMappingURL=listHDWalletXPubYPubZPubTransactionsEVMRData.js.map