"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletXPubYPubZPubDetailsUTXO400Response = void 0;
var GetHDWalletXPubYPubZPubDetailsUTXO400Response = (function () {
    function GetHDWalletXPubYPubZPubDetailsUTXO400Response() {
    }
    GetHDWalletXPubYPubZPubDetailsUTXO400Response.getAttributeTypeMap = function () {
        return GetHDWalletXPubYPubZPubDetailsUTXO400Response.attributeTypeMap;
    };
    GetHDWalletXPubYPubZPubDetailsUTXO400Response.discriminator = undefined;
    GetHDWalletXPubYPubZPubDetailsUTXO400Response.attributeTypeMap = [
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
            "type": "GetHDWalletXPubYPubZPubDetailsUTXOE400"
        }
    ];
    return GetHDWalletXPubYPubZPubDetailsUTXO400Response;
}());
exports.GetHDWalletXPubYPubZPubDetailsUTXO400Response = GetHDWalletXPubYPubZPubDetailsUTXO400Response;
//# sourceMappingURL=getHDWalletXPubYPubZPubDetailsUTXO400Response.js.map