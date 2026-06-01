"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsE400 = void 0;
var ListBlockchainEventsSubscriptionsE400 = (function () {
    function ListBlockchainEventsSubscriptionsE400() {
    }
    ListBlockchainEventsSubscriptionsE400.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsE400.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsE400.discriminator = undefined;
    ListBlockchainEventsSubscriptionsE400.attributeTypeMap = [
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
    return ListBlockchainEventsSubscriptionsE400;
}());
exports.ListBlockchainEventsSubscriptionsE400 = ListBlockchainEventsSubscriptionsE400;
//# sourceMappingURL=listBlockchainEventsSubscriptionsE400.js.map