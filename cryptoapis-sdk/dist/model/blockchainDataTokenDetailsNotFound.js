"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainDataTokenDetailsNotFound = void 0;
var BlockchainDataTokenDetailsNotFound = (function () {
    function BlockchainDataTokenDetailsNotFound() {
    }
    BlockchainDataTokenDetailsNotFound.getAttributeTypeMap = function () {
        return BlockchainDataTokenDetailsNotFound.attributeTypeMap;
    };
    BlockchainDataTokenDetailsNotFound.discriminator = undefined;
    BlockchainDataTokenDetailsNotFound.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return BlockchainDataTokenDetailsNotFound;
}());
exports.BlockchainDataTokenDetailsNotFound = BlockchainDataTokenDetailsNotFound;
//# sourceMappingURL=blockchainDataTokenDetailsNotFound.js.map