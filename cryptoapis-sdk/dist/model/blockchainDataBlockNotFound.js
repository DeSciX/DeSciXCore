"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainDataBlockNotFound = void 0;
var BlockchainDataBlockNotFound = (function () {
    function BlockchainDataBlockNotFound() {
    }
    BlockchainDataBlockNotFound.getAttributeTypeMap = function () {
        return BlockchainDataBlockNotFound.attributeTypeMap;
    };
    BlockchainDataBlockNotFound.discriminator = undefined;
    BlockchainDataBlockNotFound.attributeTypeMap = [
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
    return BlockchainDataBlockNotFound;
}());
exports.BlockchainDataBlockNotFound = BlockchainDataBlockNotFound;
//# sourceMappingURL=blockchainDataBlockNotFound.js.map