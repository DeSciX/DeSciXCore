"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptions400Response = void 0;
var ListBlockchainEventsSubscriptions400Response = (function () {
    function ListBlockchainEventsSubscriptions400Response() {
    }
    ListBlockchainEventsSubscriptions400Response.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptions400Response.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptions400Response.discriminator = undefined;
    ListBlockchainEventsSubscriptions400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListBlockchainEventsSubscriptionsE400"
        }
    ];
    return ListBlockchainEventsSubscriptions400Response;
}());
exports.ListBlockchainEventsSubscriptions400Response = ListBlockchainEventsSubscriptions400Response;
//# sourceMappingURL=listBlockchainEventsSubscriptions400Response.js.map