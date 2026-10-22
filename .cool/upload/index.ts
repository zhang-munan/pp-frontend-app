import { config } from "@/config";
import { request } from "../service";
import { basename, extname, filename, parse, parseObject, pathJoin, uuid } from "../utils";
import { useStore } from "../store";

// 上传进度回调结果类型
export type OnProgressUpdateResult = {
	progress: number;
	totalBytesSent: number;
	totalBytesExpectedToSend: number;
};

// 上传任务类型定义
export type UploadTask = {
	abort(): void;
};

// 上传选项类型定义
export type UploadOptions = {
	/** 云端对象存储目录，例如 send/app/user/avatar；未带 send 时会自动补齐 */
	prefixPath?: string;
	onProgressUpdate?: (result: OnProgressUpdateResult) => void; // 上传进度回调
	onTask?: (task: UploadTask) => void; // 上传任务回调
};

// 上传模式类型
export type UploadMode = {
	mode: "local" | "cloud"; // 上传模式：本地或云端
	type: string; // 云服务类型
};

// 上传请求的参数类型
export type UploadRequestOptions = {
	url: string;
	preview?: string;
	data: any;
};

// 云上传返回数据类型
export type CloudUploadResponse = {
	uploadUrl?: string;
	url?: string;
	host?: string;
	credentials?: any;
	OSSAccessKeyId?: string;
	policy?: string;
	signature?: string;
	publicDomain?: string;
	token?: string;
	fields?: any;
};

// 本地上传返回数据类型
export type LocalUploadResponse = {
	code: number;
	message?: string;
	data: string;
};

const CLOUD_FILE_ROOT = "send";

/**
 * 所有云端对象统一存放在 send 目录下，且避免调用方重复传入 send 前缀。
 */
function withCloudFileRoot(path: string): string {
	const normalized = path.replace(/(^\/+|\/+$)/g, "").replace(/\/+/g, "/");
	return normalized == CLOUD_FILE_ROOT || normalized.startsWith(`${CLOUD_FILE_ROOT}/`)
		? normalized
		: pathJoin(CLOUD_FILE_ROOT, normalized);
}

// 获取上传模式（本地/云端及云类型）
async function getUploadMode(): Promise<UploadMode> {
	const res = await request({
		url: "/app/base/comm/uploadMode"
	});

	return parse<UploadMode>(res!)!;
}

/**
 * 路径上传
 * @param path 文件路径
 * @param options 上传选项
 */
export async function upload(path: string, options: UploadOptions | null = null) {
	return uploadFile(
		{
			path,
			size: 0,
			name: "",
			type: "image/png"
		},
		options
	);
}

/**
 * 文件上传
 * @param file 文件信息 ChooseImageTempFile
 * @param options 上传选项
 */
export async function uploadFile(
	file: ChooseImageTempFile,
	options: UploadOptions | null = null
): Promise<string> {
	const { user } = useStore();

	// 获取上传模式和类型
	const { mode, type } = await getUploadMode();

	// 判断是否本地上传
	const isLocal = mode == "local";

	// 判断是否是云上传
	const isCloud = mode == "cloud";

	// 获取文件路径
	const filePath = file.path;

	// 获取文件名
	let fileName = file.name;

	// 如果文件名不存在，则使用文件路径的文件名
	if (fileName == "" || fileName == null) {
		fileName = basename(filePath);
	}

	// 获取文件扩展名
	let ext = extname(fileName);
	if (ext == "") {
		ext = "png";
	}

	// 生成唯一key: 原文件名_uuid.扩展名
	let key = `${filename(fileName)}_${uuid()}.${ext}`;

	// 云上传按业务目录存储，所有业务目录统一收口到 send 下
	if (isCloud) {
		const businessKey = options?.prefixPath
			? pathJoin(options.prefixPath, key)
			: `app/${Date.now()}/${key}`;
		key = withCloudFileRoot(businessKey);
	}

	// 支持多种上传方式
	return new Promise((resolve, reject) => {
		/**
		 * 实际上传文件的函数
		 * @param param0 上传参数
		 */
		function next({ url, preview, data }: UploadRequestOptions) {
			// 发起上传请求
			const task = uni.uploadFile({
				url,
				filePath,
				name: "file",
				header: {
					// 本地上传带token
					Authorization: isLocal ? user.token : null
				},
				formData: {
					...(data as UTSJSONObject),
					key
				},
			success(res) {
				if (isLocal) {
					// 本地上传返回处理
					const { code, data, message } = parseObject<LocalUploadResponse>(res.data)!;

					if (code == 1000) {
						resolve(data);
					} else {
						uni.showToast({
							title: message || "上传失败",
							icon: "none",
							duration: 2500
						});
						reject(message);
					}
				} else {
					// 云上传直接拼接url
					resolve(pathJoin(preview ?? url, key!));
				}
			},
			fail(err) {
				console.error(err);
				uni.showToast({
					title: "上传失败，请检查网络",
					icon: "none",
					duration: 2500
				});
				reject(err);
			}
			});

			// 上传任务回调
			if (options?.onTask != null) {
				options.onTask!({
					abort: () => {
						task.abort();
					}
				} as UploadTask);
			}

			// 上传进度回调
			if (options?.onProgressUpdate != null) {
				task.onProgressUpdate((result) => {
					const { progress, totalBytesSent, totalBytesExpectedToSend } = result;

					options.onProgressUpdate!({
						progress,
						totalBytesSent,
						totalBytesExpectedToSend
					});
				});
			}
		}

		// 本地上传
		if (isLocal) {
			next({
				url: config.baseUrl + "/app/base/comm/upload",
				data: {}
			});
		} else {
			// 云上传
			const data = {} as UTSJSONObject;

			// AWS需要提前传key
			if (type == "aws") {
				data.key = key;
			}

			// 获取云上传参数
			request({
				url: "/app/base/comm/upload",
				method: "POST",
				data
			})
				.then((res) => {
					const d = parse<CloudUploadResponse>(res!)!;

					switch (type) {
						// 腾讯云COS
						case "cos":
							next({
								url: d.url!,
								data: d.credentials!
							});
							break;
						// 阿里云OSS
						case "oss":
							next({
								url: d.host!,
								data: {
									OSSAccessKeyId: d.OSSAccessKeyId,
									policy: d.policy,
									signature: d.signature
								}
							});
							break;
						// 七牛云
						case "qiniu":
							next({
								url: d.uploadUrl!,
								preview: d.publicDomain,
								data: {
									token: d.token
								}
							});
							break;
						// 亚马逊AWS
						case "aws":
							next({
								url: d.url!,
								data: d.fields!
							});
							break;
					}
				})
				.catch(reject);
		}
	});
}
