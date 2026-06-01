"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainEventsCallbacksLimitReached = void 0;
var BlockchainEventsCallbacksLimitReached = (function () {
    function BlockchainEventsCallbacksLimitReached() {
    }
    BlockchainEventsCallbacksLimitReached.getAttributeTypeMap = function () {
        return BlockchainEventsCallbacksLimitReached.attributeTypeMap;
    };
    BlockchainEventsCallbacksLimitReached.discriminator = undefined;
    BlockchainEventsCallbacksLimitReached.attributeTypeMap = [
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
    return BlockchainEventsCallbacksLimitReached;
}());
exports.BlockchainEventsCallbacksLimitReached = BlockchainEventsCallbacksLimitReached;
//# sourceMappingURL=blockchainEventsCallbacksLimitReached.js.map