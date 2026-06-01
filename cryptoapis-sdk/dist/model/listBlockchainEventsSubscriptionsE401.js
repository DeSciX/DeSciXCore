"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsE401 = void 0;
var ListBlockchainEventsSubscriptionsE401 = (function () {
    function ListBlockchainEventsSubscriptionsE401() {
    }
    ListBlockchainEventsSubscriptionsE401.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsE401.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsE401.discriminator = undefined;
    ListBlockchainEventsSubscriptionsE401.attributeTypeMap = [
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
    return ListBlockchainEventsSubscriptionsE401;
}());
exports.ListBlockchainEventsSubscriptionsE401 = ListBlockchainEventsSubscriptionsE401;
//# sourceMappingURL=listBlockchainEventsSubscriptionsE401.js.map