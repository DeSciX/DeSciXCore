"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscription400Response = void 0;
var ActivateBlockchainEventSubscription400Response = (function () {
    function ActivateBlockchainEventSubscription400Response() {
    }
    ActivateBlockchainEventSubscription400Response.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscription400Response.attributeTypeMap;
    };
    ActivateBlockchainEventSubscription400Response.discriminator = undefined;
    ActivateBlockchainEventSubscription400Response.attributeTypeMap = [
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
            "type": "ActivateBlockchainEventSubscriptionE400"
        }
    ];
    return ActivateBlockchainEventSubscription400Response;
}());
exports.ActivateBlockchainEventSubscription400Response = ActivateBlockchainEventSubscription400Response;
//# sourceMappingURL=activateBlockchainEventSubscription400Response.js.map