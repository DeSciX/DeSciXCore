"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionE400 = void 0;
var ActivateBlockchainEventSubscriptionE400 = (function () {
    function ActivateBlockchainEventSubscriptionE400() {
    }
    ActivateBlockchainEventSubscriptionE400.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionE400.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionE400.discriminator = undefined;
    ActivateBlockchainEventSubscriptionE400.attributeTypeMap = [
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
    return ActivateBlockchainEventSubscriptionE400;
}());
exports.ActivateBlockchainEventSubscriptionE400 = ActivateBlockchainEventSubscriptionE400;
//# sourceMappingURL=activateBlockchainEventSubscriptionE400.js.map