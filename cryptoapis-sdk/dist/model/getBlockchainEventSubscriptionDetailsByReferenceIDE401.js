"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE401 = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceIDE401 = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceIDE401() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceIDE401.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceIDE401.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceIDE401.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceIDE401.attributeTypeMap = [
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
    return GetBlockchainEventSubscriptionDetailsByReferenceIDE401;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE401 = GetBlockchainEventSubscriptionDetailsByReferenceIDE401;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceIDE401.js.map