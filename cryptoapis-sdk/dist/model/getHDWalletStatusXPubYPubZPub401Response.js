"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletStatusXPubYPubZPub401Response = void 0;
var GetHDWalletStatusXPubYPubZPub401Response = (function () {
    function GetHDWalletStatusXPubYPubZPub401Response() {
    }
    GetHDWalletStatusXPubYPubZPub401Response.getAttributeTypeMap = function () {
        return GetHDWalletStatusXPubYPubZPub401Response.attributeTypeMap;
    };
    GetHDWalletStatusXPubYPubZPub401Response.discriminator = undefined;
    GetHDWalletStatusXPubYPubZPub401Response.attributeTypeMap = [
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
            "type": "GetHDWalletStatusXPubYPubZPubE401"
        }
    ];
    return GetHDWalletStatusXPubYPubZPub401Response;
}());
exports.GetHDWalletStatusXPubYPubZPub401Response = GetHDWalletStatusXPubYPubZPub401Response;
//# sourceMappingURL=getHDWalletStatusXPubYPubZPub401Response.js.map