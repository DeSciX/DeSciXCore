"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressXRPRIMinedInBlock = void 0;
var ListTransactionsByAddressXRPRIMinedInBlock = (function () {
    function ListTransactionsByAddressXRPRIMinedInBlock() {
    }
    ListTransactionsByAddressXRPRIMinedInBlock.getAttributeTypeMap = function () {
        return ListTransactionsByAddressXRPRIMinedInBlock.attributeTypeMap;
    };
    ListTransactionsByAddressXRPRIMinedInBlock.discriminator = undefined;
    ListTransactionsByAddressXRPRIMinedInBlock.attributeTypeMap = [
        {
            "name": "hash",
            "baseName": "hash",
            "type": "string"
        },
        {
            "name": "height",
            "baseName": "height",
            "type": "number"
        }
    ];
    return ListTransactionsByAddressXRPRIMinedInBlock;
}());
exports.ListTransactionsByAddressXRPRIMinedInBlock = ListTransactionsByAddressXRPRIMinedInBlock;
//# sourceMappingURL=listTransactionsByAddressXRPRIMinedInBlock.js.map