"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionR = void 0;
var ActivateBlockchainEventSubscriptionR = (function () {
    function ActivateBlockchainEventSubscriptionR() {
    }
    ActivateBlockchainEventSubscriptionR.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionR.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionR.discriminator = undefined;
    ActivateBlockchainEventSubscriptionR.attributeTypeMap = [
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
            "type": "ActivateBlockchainEventSubscriptionRData"
        }
    ];
    return ActivateBlockchainEventSubscriptionR;
}());
exports.ActivateBlockchainEventSubscriptionR = ActivateBlockchainEventSubscriptionR;
//# sourceMappingURL=activateBlockchainEventSubscriptionR.js.map