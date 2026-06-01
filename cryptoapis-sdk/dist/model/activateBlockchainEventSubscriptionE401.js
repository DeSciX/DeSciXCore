"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionE401 = void 0;
var ActivateBlockchainEventSubscriptionE401 = (function () {
    function ActivateBlockchainEventSubscriptionE401() {
    }
    ActivateBlockchainEventSubscriptionE401.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionE401.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionE401.discriminator = undefined;
    ActivateBlockchainEventSubscriptionE401.attributeTypeMap = [
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
    return ActivateBlockchainEventSubscriptionE401;
}());
exports.ActivateBlockchainEventSubscriptionE401 = ActivateBlockchainEventSubscriptionE401;
//# sourceMappingURL=activateBlockchainEventSubscriptionE401.js.map