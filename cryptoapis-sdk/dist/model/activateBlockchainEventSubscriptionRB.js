"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateBlockchainEventSubscriptionRB = void 0;
var ActivateBlockchainEventSubscriptionRB = (function () {
    function ActivateBlockchainEventSubscriptionRB() {
    }
    ActivateBlockchainEventSubscriptionRB.getAttributeTypeMap = function () {
        return ActivateBlockchainEventSubscriptionRB.attributeTypeMap;
    };
    ActivateBlockchainEventSubscriptionRB.discriminator = undefined;
    ActivateBlockchainEventSubscriptionRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "SyncHDWalletXPubYPubZPubRBData"
        }
    ];
    return ActivateBlockchainEventSubscriptionRB;
}());
exports.ActivateBlockchainEventSubscriptionRB = ActivateBlockchainEventSubscriptionRB;
//# sourceMappingURL=activateBlockchainEventSubscriptionRB.js.map