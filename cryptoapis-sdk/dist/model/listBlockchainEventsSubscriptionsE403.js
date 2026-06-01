"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsE403 = void 0;
var ListBlockchainEventsSubscriptionsE403 = (function () {
    function ListBlockchainEventsSubscriptionsE403() {
    }
    ListBlockchainEventsSubscriptionsE403.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsE403.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsE403.discriminator = undefined;
    ListBlockchainEventsSubscriptionsE403.attributeTypeMap = [
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
    return ListBlockchainEventsSubscriptionsE403;
}());
exports.ListBlockchainEventsSubscriptionsE403 = ListBlockchainEventsSubscriptionsE403;
//# sourceMappingURL=listBlockchainEventsSubscriptionsE403.js.map