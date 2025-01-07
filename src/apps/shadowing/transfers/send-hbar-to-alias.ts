import {
	AccountId,
	Client,
	Hbar,
	TransactionId,
	TransferTransaction,
	Status,
	PrecheckStatusError,
} from '@hashgraph/sdk';
import { sendTransactionInfoToReceiptApi } from '@/api/receipt/transaction-sender';
import { writeLogFile } from '@/utils/helpers/write-log-file';
import { resetHederaLocalNode } from '@/utils/helpers/reset-hedera-local-node';

// Creates a hedera account using TransferTransaction function. More info here
// https://docs.hedera.com/hedera/getting-started/transfer-hbar
export async function sendHbarToAlias(
	accountId: AccountId,
	evmAddress: string,
	amountHBar: number,
	client: Client,
	currentBlock: number,
	nodeAccountId: AccountId
) {
	try {
		console.log(`Running transaction ${accountId}, ${evmAddress}`);
		const transactionId = TransactionId.generate(accountId);
		const transaction = new TransferTransaction()
			.addHbarTransfer(accountId, new Hbar(amountHBar).negated())
			.addHbarTransfer(evmAddress, new Hbar(amountHBar))
			.setTransactionId(transactionId)
			.setNodeAccountIds([nodeAccountId])
			.freeze();

		// Execute the transaction
		await new Promise((resolve) => setTimeout(resolve, 1));
		const txResponse = await transaction.execute(client);
		const txTimestamp = new Date().toISOString();
		// Sends transaction data to receipt api to check if this transaction is a smart contract
		await sendTransactionInfoToReceiptApi({
			ethereumTransactionHash: null,
			hederaTransactionHash: txResponse.toJSON().transactionHash,
			currentBlock: currentBlock,
			evmAddress: evmAddress,
			txTimestamp: txTimestamp,
			transactionType: 'TRANSFER_TRANSACTION',
			transactionId: transactionId,
		});
	} catch (error: any) {
		if (error.status && error.status === 'DUPLICATE_TRANSACTION') {
			await writeLogFile(
				`logs/send-tiny-bar-to-alias-error.txt`,
				`GOT INSIDE DUPLICATE TRANSACTION`
			);
			console.error('Error sending tinyBar to alias:', error);
			await writeLogFile(
				`logs/send-tiny-bar-to-alias-error.txt`,
				`I am rerunning transaction. Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${JSON.stringify(error)} \n`
			);

			await sendHbarToAlias(
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
			console.log('PLATFORM NOT ACTIVE ERROR INSIDE');
			await writeLogFile(
				`logs/send-tiny-bar-to-alias-error.txt`,
				`Found error in block ${currentBlock} Transaction Type: TransferTransaction  \n ${error} \n`
			);
			await resetHederaLocalNode();
			await sendHbarToAlias(
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
