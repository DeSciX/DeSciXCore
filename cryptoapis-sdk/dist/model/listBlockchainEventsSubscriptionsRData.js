"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsRData = void 0;
var ListBlockchainEventsSubscriptionsRData = (function () {
    function ListBlockchainEventsSubscriptionsRData() {
    }
    ListBlockchainEventsSubscriptionsRData.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsRData.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsRData.discriminator = undefined;
    ListBlockchainEventsSubscriptionsRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListBlockchainEventsSubscriptionsRI>"
        }
    ];
    return ListBlockchainEventsSubscriptionsRData;
}());
exports.ListBlockchainEventsSubscriptionsRData = ListBlockchainEventsSubscriptionsRData;
//# sourceMappingURL=listBlockchainEventsSubscriptionsRData.js.map