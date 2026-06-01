"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpubSyncInProgress = void 0;
var XpubSyncInProgress = (function () {
    function XpubSyncInProgress() {
    }
    XpubSyncInProgress.getAttributeTypeMap = function () {
        return XpubSyncInProgress.attributeTypeMap;
    };
    XpubSyncInProgress.discriminator = undefined;
    XpubSyncInProgress.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return XpubSyncInProgress;
}());
exports.XpubSyncInProgress = XpubSyncInProgress;
//# sourceMappingURL=xpubSyncInProgress.js.map