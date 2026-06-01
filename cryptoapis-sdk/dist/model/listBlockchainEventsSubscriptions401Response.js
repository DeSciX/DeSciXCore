"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListBlockchainEventsSubscriptions401Response = void 0;
var ListBlockchainEventsSubscriptions401Response = (function () {
    function ListBlockchainEventsSubscriptions401Response() {
    }
    ListBlockchainEventsSubscriptions401Response.getAttributeTypeMap = function () {
        return ListBlockchainEventsSubscriptions401Response.attributeTypeMap;
    };
    ListBlockchainEventsSubscriptions401Response.discriminator = undefined;
    ListBlockchainEventsSubscriptions401Response.attributeTypeMap = [
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
            "type": "ListBlockchainEventsSubscriptionsE401"
        }
    ];
    return ListBlockchainEventsSubscriptions401Response;
}());
exports.ListBlockchainEventsSubscriptions401Response = ListBlockchainEventsSubscriptions401Response;
//# sourceMappingURL=listBlockchainEventsSubscriptions401Response.js.map