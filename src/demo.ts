import { sendHbarToAlias } from '@/apps/shadowing/transfers/send-hbar-to-alias';
import { AccountId, Client } from '@hashgraph/sdk';
import dotenv from 'dotenv';
import { createEthereumTransaction } from '@/apps/shadowing/ethereum/create-ethereum-transaction';
import { writeLogFile } from '@/utils/helpers/write-log-file';
dotenv.config();
const OPERATOR_PRIVATE = process.env.OPERATOR_PRIVATE;
const node = { '127.0.0.1:50211': new AccountId(3) };
const client = Client.forNetwork(node).setMirrorNetwork('127.0.0.1:5600');
const accountId = new AccountId(2);
const nodeAccountId = new AccountId(3);
client.setOperator(accountId, OPERATOR_PRIVATE || '');

const transactions = [
    '0x73f22999f77e60229a4fa110f94249222c9aaeb66d7957fcff3fdb7e54ac05d3',
    '0xccc1190ef5f4146180e61f923ad29b052ff8722c0f5023d39d648a9150783aed'
];

(async () => {
    await writeLogFile(
        `logs/demo.csv`,
        'EthereumTransactioHash,HederaTransactionHash \r\n',
        false
    );

    await sendHbarToAlias(
        accountId,
        '0x55555513537ec7f03a0Af928bcE4b200E6d677dd',
        100000,
        client,
        0,
        nodeAccountId
    );

    for (const transaction of transactions) {
        const response = await createEthereumTransaction(
            {
                txHash: transaction,
                gas: 21000,
            },
            accountId,
            client,
            nodeAccountId,
            'transaction.to',
            0
        );

        await writeLogFile(
            `logs/demo.csv`,
            `${transaction},${response ? response.transactionHash : 'INVALID ADDRESS'} \r\n`,
            false
        );
        console.log(transaction, response);
    }
})();
