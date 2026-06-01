"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionE403 = void 0;
var ActivateBlockchainEventSubscriptionE403 = (function () {
    function ActivateBlockchainEventSubscriptionE403() {
    }
    ActivateBlockchainEventSubscriptionE403.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionE403.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionE403.discriminator = undefined;
    ActivateBlockchainEventSubscriptionE403.attributeTypeMap = [
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
    return ActivateBlockchainEventSubscriptionE403;
}());
exports.ActivateBlockchainEventSubscriptionE403 = ActivateBlockchainEventSubscriptionE403;
//# sourceMappingURL=activateBlockchainEventSubscriptionE403.js.map