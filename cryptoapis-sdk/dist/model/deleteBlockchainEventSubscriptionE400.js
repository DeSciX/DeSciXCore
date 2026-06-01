"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscriptionE400 = void 0;
var DeleteBlockchainEventSubscriptionE400 = (function () {
    function DeleteBlockchainEventSubscriptionE400() {
    }
    DeleteBlockchainEventSubscriptionE400.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscriptionE400.attributeTypeMap;
    };
    DeleteBlockchainEventSubscriptionE400.discriminator = undefined;
    DeleteBlockchainEventSubscriptionE400.attributeTypeMap = [
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
    return DeleteBlockchainEventSubscriptionE400;
}());
exports.DeleteBlockchainEventSubscriptionE400 = DeleteBlockchainEventSubscriptionE400;
//# sourceMappingURL=deleteBlockchainEventSubscriptionE400.js.map