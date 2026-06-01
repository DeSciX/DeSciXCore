"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPub400Response = void 0;
var GetHDWalletStatusXPubYPubZPub400Response = (function () {
    function GetHDWalletStatusXPubYPubZPub400Response() {
    }
    GetHDWalletStatusXPubYPubZPub400Response.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPub400Response.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPub400Response.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPub400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetHDWalletStatusXPubYPubZPubE400"
        }
    ];
    return GetHDWalletStatusXPubYPubZPub400Response;
}());
exports.GetHDWalletStatusXPubYPubZPub400Response = GetHDWalletStatusXPubYPubZPub400Response;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPub400Response.js.map