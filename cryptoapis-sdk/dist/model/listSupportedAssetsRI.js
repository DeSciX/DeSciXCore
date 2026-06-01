"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSupportedAssetsRI = void 0;
var ListSupportedAssetsRI = (function () {
    function ListSupportedAssetsRI() {
    }
    ListSupportedAssetsRI.getAttributeTypeMap = function () {
        return ListSupportedAssetsRI.attributeTypeMap;
    };
    ListSupportedAssetsRI.discriminator = undefined;
    ListSupportedAssetsRI.attributeTypeMap = [
        {
            "name": "latestRate",
            "baseName": "latestRate",
            "type": "ListSupportedAssetsRILatestRate"
        },
        {
            "name": "logo",
            "baseName": "logo",
            "type": "ListSupportedAssetsRILogo"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "originalSymbol",
            "baseName": "originalSymbol",
            "type": "string"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        },
        {
            "name": "slug",
            "baseName": "slug",
            "type": "string"
        },
        {
            "name": "specificData",
            "baseName": "specificData",
            "type": "ListSupportedAssetsRIS"
        },
        {
            "name": "symbol",
            "baseName": "symbol",
            "type": "string"
        }
    ];
    return ListSupportedAssetsRI;
}());
exports.ListSupportedAssetsRI = ListSupportedAssetsRI;
//# sourceMappingURL=listSupportedAssetsRI.js.map