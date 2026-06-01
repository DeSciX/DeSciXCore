"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubUTXOsRData = void 0;
var ListHDWalletXPubYPubZPubUTXOsRData = (function () {
    function ListHDWalletXPubYPubZPubUTXOsRData() {
    }
    ListHDWalletXPubYPubZPubUTXOsRData.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubUTXOsRData.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubUTXOsRData.discriminator = undefined;
    ListHDWalletXPubYPubZPubUTXOsRData.attributeTypeMap = [
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
            "type": "Array<ListHDWalletXPubYPubZPubUTXOsRI>"
        }
    ];
    return ListHDWalletXPubYPubZPubUTXOsRData;
}());
exports.ListHDWalletXPubYPubZPubUTXOsRData = ListHDWalletXPubYPubZPubUTXOsRData;
//# sourceMappingURL=listHDWalletXPubYPubZPubUTXOsRData.js.map