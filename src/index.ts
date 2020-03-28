import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import axios, {
	AxiosAdapter,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse
} from 'axios';

let defaultAdapter: AxiosAdapter | undefined;
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

interface AxiosRecordReplayAdapterOptions {
	debug?: boolean;
	axiosInstance?: AxiosInstance;
	recordingsDir?: string;
	buildRequest?(config: AxiosRequestConfig): any;
	buildResponse?(response: AxiosResponse): any;
	buildFilenamePrefix?(request: any): string;
}

function defaultBuildRequest(requestConfig: AxiosRequestConfig): any {
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const baseURL = requestConfig.baseURL || '';

	return {
		method: requestConfig.method,
		path: new URL(baseURL + requestConfig.url!).pathname,
		data: requestConfig.data
	};
}

function defaultBuildResponse(response: AxiosResponse): any {
	return {
		status: response.status,
		statusText: response.statusText,
		data: response.data
	};
}

export default (
	options: AxiosRecordReplayAdapterOptions = {}
): (() => void) => {
	const {
		debug = false,
		axiosInstance = axios,
		recordingsDir = './recordings',
		buildRequest = defaultBuildRequest,
		buildResponse = defaultBuildResponse,
		buildFilenamePrefix
	} = options;

	log('🍿  Initialized axios-record-replay-adapter');

	try {
		const absolutePath = path.resolve(process.cwd(), recordingsDir);
		fs.mkdirSync(absolutePath);
		log(`✨  Created recordings directory (${absolutePath})`);
	} catch {}

	defaultAdapter = axiosInstance.defaults.adapter;
	axiosInstance.defaults.adapter = axiosRecordReplayAdapter;

	return () => {
		axiosInstance.defaults.adapter = defaultAdapter;
	};

	async function axiosRecordReplayAdapter(
		config: AxiosRequestConfig
	): Promise<any> {
		const request = buildRequest(config);
		const filepath = generateFilepath(request);

		try {
			const {response} = JSON.parse(await readFile(filepath, 'utf8'));
			return {config, ...response, data: JSON.stringify(response.data)};
		} catch {}

		const response = await defaultAdapter!(config);

		// If we make it to this point in CI, our recordings are out of date.
		// Notify the developer to update recordings.
		if (
			process.env.CI &&
			!(
				process.env.npm_package_repository_url &&
				process.env.npm_package_repository_url.includes(
					'bmealhouse/axios-record-replay-adapter'
				)
			)
		) {
			throw new Error(
				'Recordings out of date. Delete the recordings directory and re-run tests to update.'
			);
		}

		log(`🎥  Created recording (${path.parse(filepath).base})`);
		await writeFile(filepath, createFileContents(request, response));
		return response;
	}

	function generateFilepath(request: any): string {
		const filepath = path.resolve(process.cwd(), recordingsDir);

		const hash = crypto.createHash('md5');
		hash.update(JSON.stringify(request));
		const filename = hash.digest('hex');

		return buildFilenamePrefix
			? `${filepath}/${buildFilenamePrefix(request)}_${filename}.json`
			: `${filepath}/${filename}.json`;
	}

	function createFileContents(
		request: any,
		axiosResponse: AxiosResponse
	): string {
		const response = buildResponse(axiosResponse);
		return JSON.stringify(
			{
				request: {
					...request,
					data: safeJsonParse(request.data)
				},
				response: {
					...response,
					data: safeJsonParse(response.data)
				}
			},
			null,
			2
		);
	}

	function log(message: string): void {
		if (debug) {
			console.log(message);
		}
	}
};

function safeJsonParse(data: string): any {
	try {
		return JSON.parse(data);
	} catch {
		return Buffer.isBuffer(data) ? '[Buffer]' : data;
	}
}
