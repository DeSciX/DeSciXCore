"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaRIMinedInBlock = void 0;
var ListTransactionsByAddressSolanaRIMinedInBlock = (function () {
    function ListTransactionsByAddressSolanaRIMinedInBlock() {
    }
    ListTransactionsByAddressSolanaRIMinedInBlock.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaRIMinedInBlock.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaRIMinedInBlock.discriminator = undefined;
    ListTransactionsByAddressSolanaRIMinedInBlock.attributeTypeMap = [
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
    return ListTransactionsByAddressSolanaRIMinedInBlock;
}());
exports.ListTransactionsByAddressSolanaRIMinedInBlock = ListTransactionsByAddressSolanaRIMinedInBlock;
//# sourceMappingURL=listTransactionsByAddressSolanaRIMinedInBlock.js.map