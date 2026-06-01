"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVM400Response = void 0;
var PrepareAFungibleTokenTransferFromAddressEVM400Response = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVM400Response() {
    }
    PrepareAFungibleTokenTransferFromAddressEVM400Response.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVM400Response.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVM400Response.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVM400Response.attributeTypeMap = [
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
            "type": "PrepareAFungibleTokenTransferFromAddressEVME400"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVM400Response;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVM400Response = PrepareAFungibleTokenTransferFromAddressEVM400Response;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVM400Response.js.map