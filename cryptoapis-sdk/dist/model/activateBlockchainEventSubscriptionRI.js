"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionRI = void 0;
var ActivateBlockchainEventSubscriptionRI = (function () {
    function ActivateBlockchainEventSubscriptionRI() {
    }
    ActivateBlockchainEventSubscriptionRI.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionRI.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionRI.discriminator = undefined;
    ActivateBlockchainEventSubscriptionRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        },
        {
            "name": "confirmationsCount",
            "baseName": "confirmationsCount",
            "type": "number"
        },
        {
            "name": "createdTimestamp",
            "baseName": "createdTimestamp",
            "type": "number"
        },
        {
            "name": "eventType",
            "baseName": "eventType",
            "type": "string"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "network",
            "baseName": "network",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        }
    ];
    return ActivateBlockchainEventSubscriptionRI;
}());
exports.ActivateBlockchainEventSubscriptionRI = ActivateBlockchainEventSubscriptionRI;
//# sourceMappingURL=activateBlockchainEventSubscriptionRI.js.map