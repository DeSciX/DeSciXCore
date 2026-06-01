"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHDWalletXPubYPubZPubDetailsUTXO401Response = void 0;
var GetHDWalletXPubYPubZPubDetailsUTXO401Response = (function () {
    function GetHDWalletXPubYPubZPubDetailsUTXO401Response() {
    }
    GetHDWalletXPubYPubZPubDetailsUTXO401Response.getAttributeTypeMap = function () {
        return GetHDWalletXPubYPubZPubDetailsUTXO401Response.attributeTypeMap;
    };
    GetHDWalletXPubYPubZPubDetailsUTXO401Response.discriminator = undefined;
    GetHDWalletXPubYPubZPubDetailsUTXO401Response.attributeTypeMap = [
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
            "type": "GetHDWalletXPubYPubZPubDetailsUTXOE401"
        }
    ];
    return GetHDWalletXPubYPubZPubDetailsUTXO401Response;
}());
exports.GetHDWalletXPubYPubZPubDetailsUTXO401Response = GetHDWalletXPubYPubZPubDetailsUTXO401Response;
//# sourceMappingURL=getHDWalletXPubYPubZPubDetailsUTXO401Response.js.map