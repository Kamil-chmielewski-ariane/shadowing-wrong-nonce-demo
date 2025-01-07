import { sendTransactionInfoToReceiptApi } from '@/api/receipt/transaction-sender';
import {
	AccountId,
	Client,
	Hbar,
	TransactionId,
	TransferTransaction,
} from '@hashgraph/sdk';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { resetHederaLocalNode } from '@/utils/helpers/reset-hedera-local-node';
export async function sendTinyBarToAlias(
	accountId: AccountId,
	evmAddress: string,
	amountHBar: number,
	client: Client,
	currentBlock: number,
	nodeAccountId: AccountId
) {
	try {
		console.log(`Running tinybar transaction ${accountId}, ${evmAddress}`);
		const transactionId = TransactionId.generate(accountId);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, Hbar.fromTinybars(amountHBar).negated())
			.addHbarTransfer(evmAddress, Hbar.fromTinybars(amountHBar))
			.setTransactionId(transactionId)
			.setNodeAccountIds([nodeAccountId])
			.freeze();

		// Execute the transaction
		await new Promise((resolve) => setTimeout(resolve, 1));
		await transaction.execute(client);
		const transactionTimestamp = new Date().toISOString();
		await sendTransactionInfoToReceiptApi({
			transactionId: transactionId,
			evmAddress: evmAddress,
			currentBlock: currentBlock,
			transactionType: 'TRANSFER',
			txTimestamp: transactionTimestamp,
			ethereumTransactionHash: null,
			hederaTransactionHash: '',
		});
	} catch (error: any) {
		if (error && error.status === 'DUPLICATE_TRANSACTION') {
			console.error('Error sending tinyBar to alias:', error);
			await writeLogFile(
				`logs/send-tiny-bar-to-alias-error.txt`,
				`I am rerunning transaction. Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`
			);
			await sendTinyBarToAlias(
				accountId,
				evmAddress,
				amountHBar,
				client,
				currentBlock,
				nodeAccountId
			);
		}

		if (
			error &&
			typeof error.message === 'string' &&
			(error.message.includes('PLATFORM_NOT_ACTIVE') ||
				error.message.includes('PLATFORM_TRANSACTION_NOT_CREATED'))
		) {
			await writeLogFile(
				`logs/send-tiny-bar-to-alias-error.txt`,
				`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`
			);
			await resetHederaLocalNode();
			await sendTinyBarToAlias(
				accountId,
				evmAddress,
				amountHBar,
				client,
				currentBlock,
				nodeAccountId
			);
		}

		console.error('Error sending tinyBar to alias:', error);
		await writeLogFile(
			`logs/send-tiny-bar-to-alias-error.txt`,
			`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`
		);
	}
}
