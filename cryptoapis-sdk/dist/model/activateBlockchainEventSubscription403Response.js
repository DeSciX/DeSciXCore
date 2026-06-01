"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscription403Response = void 0;
var ActivateBlockchainEventSubscription403Response = (function () {
    function ActivateBlockchainEventSubscription403Response() {
    }
    ActivateBlockchainEventSubscription403Response.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscription403Response.attributeTypeMap;
    };
    ActivateBlockchainEventSubscription403Response.discriminator = undefined;
    ActivateBlockchainEventSubscription403Response.attributeTypeMap = [
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
            "type": "ActivateBlockchainEventSubscriptionE403"
        }
    ];
    return ActivateBlockchainEventSubscription403Response;
}());
exports.ActivateBlockchainEventSubscription403Response = ActivateBlockchainEventSubscription403Response;
//# sourceMappingURL=activateBlockchainEventSubscription403Response.js.map