"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainDataTransactionNotFound = void 0;
var BlockchainDataTransactionNotFound = (function () {
    function BlockchainDataTransactionNotFound() {
    }
    BlockchainDataTransactionNotFound.getAttributeTypeMap = function () {
        return BlockchainDataTransactionNotFound.attributeTypeMap;
    };
    BlockchainDataTransactionNotFound.discriminator = undefined;
    BlockchainDataTransactionNotFound.attributeTypeMap = [
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
    return BlockchainDataTransactionNotFound;
}());
exports.BlockchainDataTransactionNotFound = BlockchainDataTransactionNotFound;
//# sourceMappingURL=blockchainDataTransactionNotFound.js.map