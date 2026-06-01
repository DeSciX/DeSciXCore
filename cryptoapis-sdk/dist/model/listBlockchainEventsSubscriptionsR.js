"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptionsR = void 0;
var ListBlockchainEventsSubscriptionsR = (function () {
    function ListBlockchainEventsSubscriptionsR() {
    }
    ListBlockchainEventsSubscriptionsR.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptionsR.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptionsR.discriminator = undefined;
    ListBlockchainEventsSubscriptionsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ListBlockchainEventsSubscriptionsRData"
        }
    ];
    return ListBlockchainEventsSubscriptionsR;
}());
exports.ListBlockchainEventsSubscriptionsR = ListBlockchainEventsSubscriptionsR;
//# sourceMappingURL=listBlockchainEventsSubscriptionsR.js.map