"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE400 = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceIDE400 = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceIDE400() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceIDE400.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceIDE400.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceIDE400.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceIDE400.attributeTypeMap = [
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
    return GetBlockchainEventSubscriptionDetailsByReferenceIDE400;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE400 = GetBlockchainEventSubscriptionDetailsByReferenceIDE400;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceIDE400.js.map