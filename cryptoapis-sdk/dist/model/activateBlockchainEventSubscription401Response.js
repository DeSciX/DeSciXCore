"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscription401Response = void 0;
var ActivateBlockchainEventSubscription401Response = (function () {
    function ActivateBlockchainEventSubscription401Response() {
    }
    ActivateBlockchainEventSubscription401Response.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscription401Response.attributeTypeMap;
    };
    ActivateBlockchainEventSubscription401Response.discriminator = undefined;
    ActivateBlockchainEventSubscription401Response.attributeTypeMap = [
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
            "type": "ActivateBlockchainEventSubscriptionE401"
        }
    ];
    return ActivateBlockchainEventSubscription401Response;
}());
exports.ActivateBlockchainEventSubscription401Response = ActivateBlockchainEventSubscription401Response;
//# sourceMappingURL=activateBlockchainEventSubscription401Response.js.map