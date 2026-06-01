"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListHDWalletXPubYPubZPubUTXOsRI = void 0;
var ListHDWalletXPubYPubZPubUTXOsRI = (function () {
    function ListHDWalletXPubYPubZPubUTXOsRI() {
    }
    ListHDWalletXPubYPubZPubUTXOsRI.getAttributeTypeMap = function () {
        return ListHDWalletXPubYPubZPubUTXOsRI.attributeTypeMap;
    };
    ListHDWalletXPubYPubZPubUTXOsRI.discriminator = undefined;
    ListHDWalletXPubYPubZPubUTXOsRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "addressPath",
            "baseName": "addressPath",
            "type": "string"
        },
        {
            "name": "derivation",
            "baseName": "derivation",
            "type": "string"
        },
        {
            "name": "index",
            "baseName": "index",
            "type": "number"
        },
        {
            "name": "isAvailable",
            "baseName": "isAvailable",
            "type": "boolean"
        },
        {
            "name": "isConfirmed",
            "baseName": "isConfirmed",
            "type": "boolean"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListHDWalletXPubYPubZPubUTXOsRIValue"
        }
    ];
    return ListHDWalletXPubYPubZPubUTXOsRI;
}());
exports.ListHDWalletXPubYPubZPubUTXOsRI = ListHDWalletXPubYPubZPubUTXOsRI;
//# sourceMappingURL=listHDWalletXPubYPubZPubUTXOsRI.js.map