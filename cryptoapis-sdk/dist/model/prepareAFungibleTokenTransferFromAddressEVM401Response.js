"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrepareAFungibleTokenTransferFromAddressEVM401Response = void 0;
var PrepareAFungibleTokenTransferFromAddressEVM401Response = (function () {
    function PrepareAFungibleTokenTransferFromAddressEVM401Response() {
    }
    PrepareAFungibleTokenTransferFromAddressEVM401Response.getAttributeTypeMap = function () {
        return PrepareAFungibleTokenTransferFromAddressEVM401Response.attributeTypeMap;
    };
    PrepareAFungibleTokenTransferFromAddressEVM401Response.discriminator = undefined;
    PrepareAFungibleTokenTransferFromAddressEVM401Response.attributeTypeMap = [
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
            "type": "PrepareAFungibleTokenTransferFromAddressEVME401"
        }
    ];
    return PrepareAFungibleTokenTransferFromAddressEVM401Response;
}());
exports.PrepareAFungibleTokenTransferFromAddressEVM401Response = PrepareAFungibleTokenTransferFromAddressEVM401Response;
//# sourceMappingURL=prepareAFungibleTokenTransferFromAddressEVM401Response.js.map