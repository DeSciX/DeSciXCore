"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE403 = void 0;
var GetBlockchainEventSubscriptionDetailsByReferenceIDE403 = (function () {
    function GetBlockchainEventSubscriptionDetailsByReferenceIDE403() {
    }
    GetBlockchainEventSubscriptionDetailsByReferenceIDE403.getAttributeTypeMap = function () {
        return GetBlockchainEventSubscriptionDetailsByReferenceIDE403.attributeTypeMap;
    };
    GetBlockchainEventSubscriptionDetailsByReferenceIDE403.discriminator = undefined;
    GetBlockchainEventSubscriptionDetailsByReferenceIDE403.attributeTypeMap = [
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
    return GetBlockchainEventSubscriptionDetailsByReferenceIDE403;
}());
exports.GetBlockchainEventSubscriptionDetailsByReferenceIDE403 = GetBlockchainEventSubscriptionDetailsByReferenceIDE403;
//# sourceMappingURL=getBlockchainEventSubscriptionDetailsByReferenceIDE403.js.map