"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptions403Response = void 0;
var ListBlockchainEventsSubscriptions403Response = (function () {
    function ListBlockchainEventsSubscriptions403Response() {
    }
    ListBlockchainEventsSubscriptions403Response.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptions403Response.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptions403Response.discriminator = undefined;
    ListBlockchainEventsSubscriptions403Response.attributeTypeMap = [
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
            "type": "ListBlockchainEventsSubscriptionsE403"
        }
    ];
    return ListBlockchainEventsSubscriptions403Response;
}());
exports.ListBlockchainEventsSubscriptions403Response = ListBlockchainEventsSubscriptions403Response;
//# sourceMappingURL=listBlockchainEventsSubscriptions403Response.js.map