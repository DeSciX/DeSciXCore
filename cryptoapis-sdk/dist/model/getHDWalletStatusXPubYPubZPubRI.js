"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPubRI = void 0;
var GetHDWalletStatusXPubYPubZPubRI = (function () {
    function GetHDWalletStatusXPubYPubZPubRI() {
    }
    GetHDWalletStatusXPubYPubZPubRI.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPubRI.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPubRI.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPubRI.attributeTypeMap = [
        {
            "name": "extendedPublicKey",
            "baseName": "extendedPublicKey",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "syncStatus",
            "baseName": "syncStatus",
            "type": "string"
        }
    ];
    return GetHDWalletStatusXPubYPubZPubRI;
}());
exports.GetHDWalletStatusXPubYPubZPubRI = GetHDWalletStatusXPubYPubZPubRI;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPubRI.js.map