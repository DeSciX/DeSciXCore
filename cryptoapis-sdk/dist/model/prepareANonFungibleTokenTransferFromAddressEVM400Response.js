"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareANonFungibleTokenTransferFromAddressEVM400Response = void 0;
var PrepareANonFungibleTokenTransferFromAddressEVM400Response = (function () {
    function PrepareANonFungibleTokenTransferFromAddressEVM400Response() {
    }
    PrepareANonFungibleTokenTransferFromAddressEVM400Response.getAttributeTypeMap = function () {
        return PrepareANonFungibleTokenTransferFromAddressEVM400Response.attributeTypeMap;
    };
    PrepareANonFungibleTokenTransferFromAddressEVM400Response.discriminator = undefined;
    PrepareANonFungibleTokenTransferFromAddressEVM400Response.attributeTypeMap = [
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
            "type": "PrepareANonFungibleTokenTransferFromAddressEVME400"
        }
    ];
    return PrepareANonFungibleTokenTransferFromAddressEVM400Response;
}());
exports.PrepareANonFungibleTokenTransferFromAddressEVM400Response = PrepareANonFungibleTokenTransferFromAddressEVM400Response;
//# sourceMappingURL=prepareANonFungibleTokenTransferFromAddressEVM400Response.js.map