"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteBlockchainEventSubscriptionR = void 0;
var DeleteBlockchainEventSubscriptionR = (function () {
    function DeleteBlockchainEventSubscriptionR() {
    }
    DeleteBlockchainEventSubscriptionR.getAttributeTypeMap = function () {
        return DeleteBlockchainEventSubscriptionR.attributeTypeMap;
    };
    DeleteBlockchainEventSubscriptionR.discriminator = undefined;
    DeleteBlockchainEventSubscriptionR.attributeTypeMap = [
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
            "type": "DeleteBlockchainEventSubscriptionRData"
        }
    ];
    return DeleteBlockchainEventSubscriptionR;
}());
exports.DeleteBlockchainEventSubscriptionR = DeleteBlockchainEventSubscriptionR;
//# sourceMappingURL=deleteBlockchainEventSubscriptionR.js.map