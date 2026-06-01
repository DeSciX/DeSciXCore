"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPubR = void 0;
var GetHDWalletStatusXPubYPubZPubR = (function () {
    function GetHDWalletStatusXPubYPubZPubR() {
    }
    GetHDWalletStatusXPubYPubZPubR.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPubR.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPubR.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPubR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetHDWalletStatusXPubYPubZPubRData"
        }
    ];
    return GetHDWalletStatusXPubYPubZPubR;
}());
exports.GetHDWalletStatusXPubYPubZPubR = GetHDWalletStatusXPubYPubZPubR;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPubR.js.map