"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscriptionE401 = void 0;
var DeleteBlockchainEventSubscriptionE401 = (function () {
    function DeleteBlockchainEventSubscriptionE401() {
    }
    DeleteBlockchainEventSubscriptionE401.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscriptionE401.attributeTypeMap;
    };
    DeleteBlockchainEventSubscriptionE401.discriminator = undefined;
    DeleteBlockchainEventSubscriptionE401.attributeTypeMap = [
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
    return DeleteBlockchainEventSubscriptionE401;
}());
exports.DeleteBlockchainEventSubscriptionE401 = DeleteBlockchainEventSubscriptionE401;
//# sourceMappingURL=deleteBlockchainEventSubscriptionE401.js.map