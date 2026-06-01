"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscriptionE403 = void 0;
var DeleteBlockchainEventSubscriptionE403 = (function () {
    function DeleteBlockchainEventSubscriptionE403() {
    }
    DeleteBlockchainEventSubscriptionE403.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscriptionE403.attributeTypeMap;
    };
    DeleteBlockchainEventSubscriptionE403.discriminator = undefined;
    DeleteBlockchainEventSubscriptionE403.attributeTypeMap = [
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
    return DeleteBlockchainEventSubscriptionE403;
}());
exports.DeleteBlockchainEventSubscriptionE403 = DeleteBlockchainEventSubscriptionE403;
//# sourceMappingURL=deleteBlockchainEventSubscriptionE403.js.map